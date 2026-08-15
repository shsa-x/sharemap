import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.min.js';
import { useSelector } from 'react-redux';

const png = "https://res.cloudinary.com/dfl8h4on4/image/upload/v1727010083/location_2_bxhejq.png"

const createCustomMarker = (name, msg) => {
  const iconUrl = png;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-[6vh] h-[6vh] relative " >
        <div class=" flex flex-col justify-center items-center absolute bottom-[200%] transform translate-x-[-50%]" >
          <div class=" px-2 border-neutral-700 bg-yellow-100 rounded-md font-bold text-md">${name}</div>
        </div>
        <div>
          <img style='width:6vh;' class=' absolute bottom-[100%] right-[48%] ' src=${iconUrl} alt="Location Icon" />
        </div>
      </div>
    `,
    iconSize: [100, 50],
    iconAnchor: [0, 0],
  });
};

const MapEvents = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
};

const TimeAgo = ({ timestamp }) => {
  const [timeStr, setTimeStr] = useState('just now');

  useEffect(() => {
    if (!timestamp) return;

    const updateTime = () => {
      const diff = Math.floor((Date.now() - timestamp) / 1000);
      if (diff < 2) setTimeStr('just now');
      else if (diff < 60) setTimeStr(`${diff}s ago`);
      else setTimeStr(`${Math.floor(diff / 60)}m ago`);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [timestamp]);

  return <span>{timeStr}</span>;
};

function MapComponent({ mapLayer, mapRef, pathCoordinates }) {
  const mapTilerKey = "A7ggsa5XFdC8i2v2pyJz";
  const group = useSelector(state => state.locations.group);
  const user = useSelector(state => state.locations.user);
  const messages = useSelector(state => state.locations.messages);

  const formatSpeed = (mps) => {
    if (!mps) return "0.0 km/h";
    return (mps * 3.6).toFixed(1) + " km/h";
  }

  const getDirectionText = (degree) => {
    if (degree === undefined || degree === null) return "N/A";
    const val = Math.floor((degree / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
  }

  // Convert path coordinates to Leaflet format [lat, lng]
  // Assuming pathCoordinates is an array like: [{lat, long}, {lat, long}, ...]
  //   const pathPositions = pathCoordinates.map(coord => [coord.lat, coord.long]);
  // console.log("Path Coordinates in MapComponent:", pathCoordinates);

  // Restrict panning beyond the world edges
  const worldBounds = [
    [-90, -180],
    [90, 180]
  ];

  return (
    <>
      <MapContainer
        center={[26, 82]}
        zoom={8}
        minZoom={3}
        maxBounds={worldBounds}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", backgroundColor: "#0a0a0a" }}
        whenReady={(mapInstance) => { mapRef.current = mapInstance; }}
      >
        <TileLayer
          url={`${mapLayer}?key=${mapTilerKey}`}
          noWrap={true}
          bounds={worldBounds}
        />

        {/* Render all user markers */}
        {
          Object.keys(group).map(key => {
            const { lat, long, name, isActive, speed, heading, accuracy, timestamp } = group[key];
            const msg = messages[name] || ""

            const renderTooltip = () => (
              <Tooltip direction="top" offset={[0, -50]} opacity={0.95}>
                <div className="flex flex-col text-sm min-w-[140px]">
                  <span className="font-bold border-b pb-1 mb-1 capitalize text-blue-600 text-base">{name} {name === user ? '(You)' : ''}</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span className="text-gray-500">Speed:</span>
                    <span className="font-semibold text-gray-800">{formatSpeed(speed)}</span>

                    <span className="text-gray-500">Heading:</span>
                    <span className="font-semibold text-gray-800">{getDirectionText(heading)}</span>

                    <span className="text-gray-500">Accuracy:</span>
                    <span className="font-semibold text-gray-800">±{accuracy ? Math.round(accuracy) : 0}m</span>

                    <span className="text-gray-500">Updated:</span>
                    <span className="font-semibold text-green-600"><TimeAgo timestamp={timestamp} /></span>
                  </div>
                </div>
              </Tooltip>
            );

            return user != name ? (
              <Marker
                key={key}
                position={[lat, long]}
                icon={createCustomMarker(name, msg)}
                eventHandlers={{
                  click: () => {
                    if (mapRef.current && lat !== -1) {
                      mapRef.current.flyTo([lat, long], 18);
                    }
                  }
                }}
              >
                {renderTooltip()}
              </Marker>
            ) : (
              <Marker
                key={key}
                position={[lat, long]}
                icon={createCustomMarker("you", msg)}
                eventHandlers={{
                  click: () => {
                    if (mapRef.current && lat !== -1) {
                      mapRef.current.flyTo([lat, long], 18);
                    }
                  }
                }}
              >
                {renderTooltip()}
              </Marker>
            )
          })
        }
        {/* Render the A* path if it exists */}
        {pathCoordinates.length > 0 && (
          <Polyline
            positions={pathCoordinates.map(coord => [coord.lat, coord.lng])}
            color="blue"
            weight={4}
            opacity={0.7}
            smoothFactor={1}
          />
        )}

        {/* Optional: Add markers at each path node for better visualization */}
        {pathCoordinates.length > 0 && pathCoordinates.map((coord, index) => (
          <Marker
            key={`path-node-${index}`}
            position={[coord.lat, coord.lng]}
            icon={L.divIcon({
              className: 'path-node-marker',
              html: `<div style="width: 8px; height: 8px; background: red; border: 2px solid white; border-radius: 50%;"></div>`,
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            })}
          />
        ))}
        <MapEvents mapRef={mapRef} />
      </MapContainer>
    </>
  );
}

export default MapComponent;