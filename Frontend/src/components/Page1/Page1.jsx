import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { joinVisFunc, popupData, popupVisFunc, registerVisFunc, loginVisFunc } from "../../features/visibilitySlice";
import { useSocket } from "../../hooks/useSocket.js";
import { setGroupIdURL, setMyName, setAccessAndRefreshToken } from "../../features/locationSlice.js";
import { generateAESGroupSessionKey } from "../../utils/asymmetricCrypto.js";
import { setSessionKey } from "../../utils/crypto.js";
import { SERVER_URL } from "../../config.js";
import {
  Users,
  MapPin,
  Radar,
  MessageCircle,
  ShieldCheck,
  Link2,
  Gauge,
  Layers,
  Zap,
  QrCode,
  Lock,
} from "lucide-react";

const GithubIcon = ({ className }) => (
  <img 
    src="https://res.cloudinary.com/dfl8h4on4/image/upload/v1784701573/github-142-svgrepo-com_m7fuqs.svg" 
    alt="GitHub" 
    className={className} 
    aria-hidden="true" 
  />
);

const whyCards = [
  {
    icon: Users,
    title: "Never Lose Your Crew",
    body: 'Ditch the "where are you?" texts. Instantly locate your friends by the food trucks or the main stage, even when the venue is packed.',
    tone: "ethan",
  },
  {
    icon: MapPin,
    title: "Sync Your Road Trip",
    body: "Traveling in multiple cars? See who took a wrong exit or stopped for gas, without dangerous texting behind the wheel.",
    tone: "accent-blue",
  },
  {
    icon: Radar,
    title: "Explore Together, Safely",
    body: "Whether you're hiking a dense trail or hitting the ski slopes, keep track of everyone's pace and ensure no one gets left behind.",
    tone: "bengi",
  },
  {
    icon: ShieldCheck,
    title: "Keep the Family Close",
    body: "Enjoy total peace of mind at busy theme parks or crowded cities. Always know exactly where the kids or grandparents have wandered off to.",
    tone: "hohn",
  },
  {
    icon: Layers,
    title: "Master Event Logistics",
    body: "Get a bird's-eye view of your entire operation. Deploy security, manage volunteers, and coordinate your crew across large venues seamlessly.",
    tone: "ethan",
  },
];

const steps = [
  {
    icon: Users,
    title: "One-Click Group Creation",
    body: "Ready in seconds. No forms, no email login required. Just tap and go.",
  },
  {
    icon: Link2,
    title: "Join With a Link or Code",
    body: "Send a secure link to your crew and they appear on your map instantly.",
  },
  {
    icon: MapPin,
    title: "Real-Time Location Updates",
    body: "Stay perfectly synchronized. View group speed, direction, and live movement on a dynamic map.",
  },
  {
    icon: MessageCircle,
    title: "Built-In Messaging",
    body: "Message your group directly from the map screen, protected by the same end-to-end encryption.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "E2E encrypted",
    body: "Message and location sharing fully encrypted, end to end.",
  },
  {
    icon: Radar,
    title: "A* routing",
    body: "Smart routing between group members, currently covering up to 20km.",
  },
  {
    icon: Gauge,
    title: "Realtime updates",
    body: "Direction, speed and accuracy streamed live to everyone in the group.",
  },
  {
    icon: Zap,
    title: "Easy group creation",
    body: "Create or join a group in one tap — no accounts, no friction.",
  },
  {
    icon: Layers,
    title: "Multiple map layers",
    body: "Switch between street, terrain and satellite styles as you travel.",
  },
];

const toneClasses = {
  ethan: { bg: "bg-ethan/15", text: "text-ethan" },
  bengi: { bg: "bg-bengi/20", text: "text-bengi" },
  hohn: { bg: "bg-hohn/25", text: "text-hohn" },
  "accent-blue": { bg: "bg-accent-blue/15", text: "text-accent-blue" },
};

function SectionTitle({ title }) {
  return (
    <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
      {title}
    </h2>
  );
}

function Page1() {
  const dispatch = useDispatch();
  const { joinRoom, leaveRoom, checkRoomExists } = useSocket();
  const user = useSelector((state) => state.locations.user);
  const isGuest = useSelector((state) => state.locations.isGuest);
  const activeGroupId = useSelector((state) => state.locations.groupId);
  const accessToken = useSelector(state => state.locations.accessToken);
  const avatar = useSelector(state => state.locations.avatar);
  const isSessionChecking = useSelector((state) => state.locations.isSessionChecking);
  
  const [groupIdInput, setGroupIdInput] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setLoading] = useState(false);

  function generateGroupId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const showPopup = (message, color) => {
    dispatch(popupData({ message, color }));
    dispatch(popupVisFunc());
    setTimeout(() => {
      dispatch(popupVisFunc());
    }, 3000);
  };

  const createGroupBtn = () => {
    if (isGuest) {
      showPopup("Guests cannot create groups. Please sign in.", "red");
      return;
    }
    if (!user) {
      dispatch(registerVisFunc());
      return;
    } else {
      let code = generateGroupId();
      const url = `${window.location.origin}/jxcd/${code}`;

      const newSessionKey = generateAESGroupSessionKey();
      setSessionKey(newSessionKey);

      joinRoom(code, user, true);
      dispatch(setGroupIdURL({ groupId: code, groupURL: url }));
      dispatch(joinVisFunc());
    }
  };

  const joinGroupBtn = async () => {
    if (!user) {
      dispatch(registerVisFunc());
    } else {
      if (groupIdInput.length < 10) {
        showPopup("Invalid Group ID!", "red");
        return;
      }
      
      const exists = await checkRoomExists(groupIdInput);
      if (!exists) {
        showPopup("Room does not exist!", "red");
        return;
      }

      dispatch(
        setGroupIdURL({
          groupId: groupIdInput,
          groupURL: `${window.location.origin}/jxcd/${groupIdInput}`,
        })
      );
      dispatch(joinVisFunc());
    }
  };
  
  const handleLogout = async () => {
    setLoading(true);
    setShowUserMenu(false);
    
    try {
      const response = await fetch(`${SERVER_URL}/users/logout`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken })
      });
      
      const data = await response.json();

      if (data.success) {
        leaveRoom(activeGroupId, user);
        showPopup(data.message, "green");
        dispatch(setMyName(""));
        dispatch(setAccessAndRefreshToken({ accessToken: "", refreshToken: "" }));
      } else {
        showPopup(data.message, "red");
      }
    } catch (error) {
      showPopup("Something went wrong!", "red");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans selection:bg-accent-blue/20 w-full relative z-10">
      {/* Navigation */}
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-8 relative z-50">
        <div className="text-2xl font-extrabold tracking-tighter">ShareMap</div>
        <div className="flex items-center gap-3">
          <div className="hidden text-sm font-semibold text-ink/70 md:block">
            Open Source &amp; E2EE
          </div>
          <a
            href="https://github.com/shivamsahu-tech/sharemap"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <GithubIcon className="size-5" aria-hidden="true" />
          </a>
          
          {!user ? (
            <button 
              onClick={() => dispatch(loginVisFunc())}
              disabled={isSessionChecking}
              className={`cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-canvas transition-transform ${isSessionChecking ? 'opacity-70 flex items-center gap-2 cursor-not-allowed' : 'hover:scale-[1.03]'}`}
            >
              {isSessionChecking && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSessionChecking ? 'Loading...' : 'Login'}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-canvas bg-ink hover:opacity-90 rounded-xl shadow-sm transition-transform hover:scale-[1.03]"
              >
                <span className="max-w-[120px] truncate">{user}</span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100">
                    <div className="py-2 px-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {isLoading ? "Logging out..." : "Log out"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-12 md:px-8 lg:grid-cols-2 relative z-20">
        <div className="space-y-8">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink/60 bg-white/50 backdrop-blur-sm">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Privacy-First Location
            </span>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-ink text-balance sm:text-6xl lg:text-7xl lg:leading-[1.1]">
              Stay Synced on <br />
              Every Journey
            </h1>

            <p className="max-w-xl text-xl leading-relaxed text-ink/75 md:text-2xl">
              Real-time location sharing that doesn't sell your data.
              End-to-end encrypted, open source, and built for people who just
              want to find their friends.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                if (user) {
                  document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  dispatch(registerVisFunc());
                }
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1a1b26] px-8 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-black hover:scale-[1.02]"
            >
              <MapPin className="size-5" aria-hidden="true" />
              Get Started
            </button>
            <a
              href="https://github.com/shivamsahu-tech/sharemap"
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white shadow-sm px-8 py-4 text-lg font-bold text-gray-800 transition-colors hover:bg-gray-50"
            >
              <GithubIcon className="size-5" aria-hidden="true" />
              View on GitHub
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-base font-semibold text-ink/70">
            <span className="inline-flex items-center gap-2">
              <Lock className="size-4" aria-hidden="true" /> No accounts needed
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden="true" /> End-to-end
              encrypted
            </span>
            <span className="inline-flex items-center gap-2">
              <GithubIcon className="size-4" aria-hidden="true" /> 100% open source
            </span>
          </div>
        </div>

        {/* Right Side: The Map */}
        <div className="relative lg:w-[120%] lg:-ml-4 z-10">
          <div className="relative w-full overflow-hidden rounded-2xl ">
            <img 
                src="https://res.cloudinary.com/dfl8h4on4/image/upload/v1786640935/Screenshot_from_2026-08-13_22-38-32_uecc8g.png"
                alt="ShareMap Map Preview"
                className="w-full h-full"
            />
          </div>
        </div>
      </main>

      {/* Why need this */}
      <section className="mx-auto max-w-7xl border-t border-ink/10 px-6 py-20 md:px-8 relative z-20">
        <SectionTitle title="Why need this" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {whyCards.map(({ icon: Icon, title, body, tone }) => {
            const t = toneClasses[tone] ?? toneClasses["accent-blue"];
            return (
              <article
                key={title}
                className="rounded-3xl border-2 border-ink/10 bg-white/70 p-7 transition-colors hover:border-ink/25"
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${t.bg}`}
                >
                  <Icon className={`size-6 ${t.text}`} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-ink/70">
                  {body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl border-t border-ink/10 px-6 py-20 md:px-8 relative z-20">
        <SectionTitle title="How it works" />
        <ol className="mt-12 grid gap-8 md:grid-cols-2">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="flex gap-5 rounded-3xl border-2 border-ink/10 bg-white/50 p-6"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-canvas">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  <span className="text-ink/40">{i + 1}.</span> {title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink/70">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>      {/* Create / Join group */}
      <section id="create-group-section" className="mx-auto max-w-7xl px-6 pb-20 md:px-8 relative z-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-ink bg-white/70 p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <QrCode className="size-6 text-ethan" aria-hidden="true" />
              <h3 className="text-xl font-bold">Create Secure Group</h3>
            </div>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              Spin up an encrypted group in one tap and share the code with your
              crew.
            </p>
            <button 
              onClick={createGroupBtn}
              disabled={isSessionChecking}
              className={`mt-6 cursor-pointer rounded-xl bg-ink px-6 py-3 text-base font-bold text-canvas transition-transform inline-flex items-center gap-2 ${isSessionChecking ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              {isSessionChecking && (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSessionChecking ? 'Loading...' : 'Create group'}
            </button>
          </div>

          <div className="rounded-3xl border-2 border-ink bg-white/70 p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Link2 className="size-6 text-accent-blue" aria-hidden="true" />
              <h3 className="text-xl font-bold">Join Group</h3>
            </div>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              Got a code from your crew? Drop it in and hop straight on the map.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Group ID"
                aria-label="Group ID"
                value={groupIdInput}
                onChange={(e) => setGroupIdInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && joinGroupBtn()}
                className="min-w-0 flex-1 rounded-xl border-2 border-ink/20 bg-canvas px-4 py-3 text-base font-semibold outline-none placeholder:text-ink/45 focus:border-accent-blue"
              />
              <button 
                onClick={joinGroupBtn}
                className="cursor-pointer rounded-xl border-2 border-ink px-6 py-3 text-base font-bold transition-colors hover:bg-ink/5"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl border-t border-gray-200 px-6 py-20 md:px-8 relative z-20">
        <SectionTitle title="Features" />
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon
                className="mt-1 size-5 shrink-0 text-accent-blue"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-base leading-relaxed text-ink/70">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why ShareMap */}
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8 relative z-20">
        <SectionTitle title="Why ShareMap" />
        <div className="mt-6 max-w-3xl space-y-5 text-lg leading-relaxed text-ink/75">
          <p>
            Did you know that standard location sharing apps like Google Maps
            don't use end-to-end encryption?
          </p>
          <p>
            We believe your location data belongs to you. ShareMap provides
            completely secure, end-to-end encryption for every group member. We
            don't require strict email-based logins, because we respect your
            privacy from the start.
          </p>
          <p>
            Don't just take our word for it — we are 100% open source. Check out
            our codebase and verify it yourself.
          </p>
        </div>
        <a
          href="https://github.com/shivamsahu-tech/sharemap"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl border-2 border-ink px-6 py-3 text-base font-bold transition-colors hover:bg-ink/5"
        >
          <GithubIcon className="size-5" aria-hidden="true" />
          Github Repo
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink/10 bg-white/50 relative z-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between md:px-8">
          <div>
            <div className="text-2xl font-extrabold tracking-tighter">
              ShareMap
            </div>
            <ul className="mt-4 space-y-2 text-base text-ink/70">
              <li>
                <a href="https://github.com/shivamsahu-tech/sharemap" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-accent-blue transition-colors">
                  <GithubIcon className="size-4" aria-hidden="true" /> Open source
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="size-4" aria-hidden="true" /> E2E encrypted
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4" aria-hidden="true" /> Privacy
                first
              </li>
            </ul>
          </div>
          <div className="md:text-right">
            <div className="text-lg font-bold">About Developer</div>
            <p className="mt-2 text-base text-ink/70">
              <a
                href="https://shivamsahu.me"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-ink underline underline-offset-4 transition-colors hover:text-accent-blue"
              >
                shivamsahu.me
              </a>
            </p>
            <p className="text-base text-ink/50">last update : aug 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Page1;
