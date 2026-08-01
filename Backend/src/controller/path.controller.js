import { asyncHandler } from "../utils/asyncHandler.js"



const findPath = asyncHandler(async(req, res) => {
    const {source, destination} = await req.body
    console.log("valuse   ",  source, destination)
    if(!source || !destination){
        return res
        .status(404)
        .json({
            statusCode: 404,
            message: "something is missing!😖",
            success: false
        })
    }
    
    // Check if distance > 20000 meters (20km)
    const distance = haversineDistance(
        { lat: Number(source.lat), lng: Number(source.lng) },
        { lat: Number(destination.lat), lng: Number(destination.lng) }
    );
    
    if (distance > 20000) {
        return res.status(400).json({
            statusCode: 400,
            message: "Distance too large! To save server resources, pathfinding is disabled for distances over 20km. 😖",
            success: false
        });
    }

    // we are creating a box, with both coordinates as diagonal points
    // and fetching all the highways in that box
    const boxResult = boundingBox(source, destination)
    // console.log(boxResult)

    const query = `
        [out:json];
        (
        way[highway](${boxResult.minLat},${boxResult.minLng},${boxResult.maxLat},${boxResult.maxLng});
        >;
        );
        out body;
        `;

    const OSM_RESPONSE = await fetch("https://overpass-api.de/api/interpreter", {
                        method: "POST",
                        body: query,
                        })
    
    const data = await OSM_RESPONSE.json()
    // console.log("data retrived")

    if(!data?.elements?.length){
        return res
        .status(404)
        .json({
            statusCode: 404,
            message: "No data found!😖",
            success: false
        })
    }

    const nodes = {}
    const graph = {}

    // Building an adjacency map representation of the graph
    // And a nodes map for corresponding coordinates to the node id
    data.elements.forEach(element => {
        if(element.type === "node"){
            nodes[element.id] = {
                lat: element.lat,
                lng: element.lon
            }
        } else if (element.type === "way"){
            for(let i=0; i<element.nodes.length -1; i++){
                const nodeA = element.nodes[i]
                const nodeB = element.nodes[i+1]
                
                if(!graph[nodeA]){
                    graph[nodeA] = []
                }   
                if(!graph[nodeB]){
                    graph[nodeB] = []
                }

                const distance = haversineDistance(
                    {lat: nodes[nodeA].lat, lng: nodes[nodeA].lng},
                    {lat: nodes[nodeB].lat, lng: nodes[nodeB].lng}
                )

                graph[nodeA].push({node: nodeB, distance})
                graph[nodeB].push({node: nodeA, distance})
            }
        }  

    });


    // for(let i = 0; i < 10; i++){
    //     console.log("Graph sample:", Object.keys(graph)[i], graph[Object.keys(graph)[i]]);
    // }

    // for(let i = 0; i < 10; i++){
    //     console.log("Node sample:", Object.keys(nodes)[i], nodes[Object.keys(nodes)[i]]);
    // }


    /*
    we are finding path, between the nearest node to the orignal source and original destination node
    */
    const startNodeId = findNearestNode(source.lat, source.lng, nodes);
    const endNodeId = findNearestNode(destination.lat, destination.lng, nodes);

    // console.log("Start Node ID:", startNodeId);
    // console.log("End Node ID:", endNodeId);

    if(!isNodeInGraph(graph, startNodeId) || !isNodeInGraph(graph, endNodeId)){
        console.log(
            "no nodes in graph!!!!!!!"
        )
        return res
        .status(404)
        .json({
            statusCode: 404,
            message: "No path found!😖",
            success: false
        })
    }

    
    const pathNodes = AStar(graph, nodes, startNodeId, endNodeId);

    if(!pathNodes){
        return res
        .status(404)
        .json({
            statusCode: 404,
            message: "No path found!😖",
            success: false
        })
    }

    // console.log("Path Nodes:", pathNodes);

    const pathCoordinates = pathNodes.map(nodeId => nodes[nodeId]);

    return res
    .status(200)
    .json({
        statusCode: 200,
        message: "Path found successfully!😊",
        success: true,
        data: pathCoordinates
    })

})



const isNodeInGraph = (graph, nodeId) => {
  return graph.hasOwnProperty(nodeId.toString());
};



const boundingBox = (pointA, pointB) => {
  const margin = 0.02;

  const minLat = Math.min(Number(pointA.lat), Number(pointB.lat)) - margin;
  const maxLat = Math.max(Number(pointA.lat), Number(pointB.lat)) + margin;
  const minLng = Math.min(Number(pointA.lng), Number(pointB.lng)) - margin;
  const maxLng = Math.max(Number(pointA.lng), Number(pointB.lng)) + margin;

//   console.log("values: ", minLat, maxLat, minLng, maxLng);
  return { minLat, maxLat, minLng, maxLng };
}


const haversineDistance = (a, b) => {
  const R = 6371e3;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}



function findNearestNode(lat, lng, nodes) {
  let nearestNodeId = null;
  let minDistance = Infinity;

  for (const [nodeId, node] of Object.entries(nodes)) {
    const distance = Math.hypot(node.lat - lat, node.lng - lng);

    if (distance < minDistance) {
      minDistance = distance;
      nearestNodeId = nodeId;
    }
  }

  return nearestNodeId;
}


const AStar = (graph, nodes, startNode, endNode) => {
  startNode = startNode.toString();
  endNode = endNode.toString();

  let openSet = [startNode];
  let cameFrom = {};
  let gScore = {};
  let fScore = {};

  for (let node in graph) {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  }

  gScore[startNode] = 0;
  fScore[startNode] = haversineDistance(nodes[startNode], nodes[endNode]);

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore[a] - fScore[b]);
    let current = openSet.shift();

    if (current === endNode) {
      let path = [current];
      while (current in cameFrom) {
        current = cameFrom[current];
        path.unshift(current);
      }
      return path;
    }

    if (!graph[current]) continue;

    for (let neighborObj of graph[current]) {
      const neighborId = neighborObj.node.toString();
      const distance = neighborObj.distance;
      const tentative_g = gScore[current] + distance;

      if (tentative_g < gScore[neighborId]) {
        cameFrom[neighborId] = current;
        gScore[neighborId] = tentative_g;
        fScore[neighborId] = tentative_g + haversineDistance(nodes[neighborId], nodes[endNode]);
        if (!openSet.includes(neighborId)) openSet.push(neighborId);
      }
    }
  }

  return null;
};




export { findPath
}