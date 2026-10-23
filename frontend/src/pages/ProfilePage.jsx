import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Check, Lock, Unlock, Trophy, Zap, Shield, Activity, User, Award, Flame, Bug } from "lucide-react";
import { Navbar } from '../components/Navbar';
import { DailyRewards } from "../components/DailyRewards";
import { Footer } from "../components/landing/Footer";
import { CustomCursor } from "../components/landing/CustomCursor";
import { profileAPI, levelsAPI, tournamentAPI, bugHunterAPI, pointsAPI } from "../utils/api";
import { PremiumIcon } from "../components/landing/PremiumIcon";
import RANK_TIERS from "../../../shared/rankTiers.json";
import curriculumLimits from "../config/curriculumLimits";

const MALE_IMAGES = [
  "/assets/profile-images/male_human_01.png",
  "/assets/profile-images/male_human_02.png",
  "/assets/profile-images/male_human_03.png",
  "/assets/profile-images/male_human_04.png",
  "/assets/profile-images/male_human_05.png",
  "/assets/profile-images/male_human_06.png",
  "/assets/profile-images/male_human_07.png",
  "/assets/profile-images/male_human_08.png",
  "/assets/profile-images/male_human_09.png",
  "/assets/profile-images/male_human_10.png",
  "/assets/profile-images/male_human_11.png",
  "/assets/profile-images/male_human_12.png",
  "/assets/profile-images/male_human_13.png",
  "/assets/profile-images/male_human_14.png",
  "/assets/profile-images/male_human_15.png",
  "/assets/profile-images/male_human_16.png",
  "/assets/profile-images/male_human_17.png",
  "/assets/profile-images/male_human_18.png",
  "/assets/profile-images/male_human_19.png",
  "/assets/profile-images/male_human_20.png",
  "/assets/profile-images/male_human_21.png",
  "/assets/profile-images/male_human_22.png",
  "/assets/profile-images/male_human_23.png",
  "/assets/profile-images/male_human_24.png",
  "/assets/profile-images/male_human_25.png",
  "/assets/profile-images/male_human_26.png",
  "/assets/profile-images/male_human_27.png",
  "/assets/profile-images/male_human_28.png",
  "/assets/profile-images/male_human_29.png",
  "/assets/profile-images/male_human_30.png",
  "/assets/profile-images/male_human_31.png",
  "/assets/profile-images/male_human_32.png",
  "/assets/profile-images/male_human_33.png",
  "/assets/profile-images/male_human_34.png",
  "/assets/profile-images/male_human_35.png",
  "/assets/profile-images/male_human_36.png",
  "/assets/profile-images/male_human_37.png",
  "/assets/profile-images/male_human_38.png",
  "/assets/profile-images/male_human_39.png",
  "/assets/profile-images/male_human_40.png",
  "/assets/profile-images/male_human_41.png",
  "/assets/profile-images/male_human_42.png",
  "/assets/profile-images/male_human_43.png",
  "/assets/profile-images/male_human_44.png",
  "/assets/profile-images/male_human_45.png",
  "/assets/profile-images/male_human_46.png",
  "/assets/profile-images/male_human_47.png",
  "/assets/profile-images/male_human_48.png",
  "/assets/profile-images/male_human_49.png",
  "/assets/profile-images/male_human_50.png",
];

const FEMALE_IMAGES = [
  "/assets/profile-images/female_human_01.png",
  "/assets/profile-images/female_human_02.png",
  "/assets/profile-images/female_human_03.png",
  "/assets/profile-images/female_human_04.png",
  "/assets/profile-images/female_human_05.png",
  "/assets/profile-images/female_human_06.png",
  "/assets/profile-images/female_human_07.png",
  "/assets/profile-images/female_human_08.png",
  "/assets/profile-images/female_human_09.png",
  "/assets/profile-images/female_human_10.png",
  "/assets/profile-images/female_human_11.png",
  "/assets/profile-images/female_human_12.png",
  "/assets/profile-images/female_human_13.png",
  "/assets/profile-images/female_human_14.png",
  "/assets/profile-images/female_human_15.png",
  "/assets/profile-images/female_human_16.png",
  "/assets/profile-images/female_human_17.png",
  "/assets/profile-images/female_human_18.png",
  "/assets/profile-images/female_human_19.png",
  "/assets/profile-images/female_human_20.png",
  "/assets/profile-images/female_human_21.png",
  "/assets/profile-images/female_human_22.png",
  "/assets/profile-images/female_human_23.png",
  "/assets/profile-images/female_human_24.png",
  "/assets/profile-images/female_human_25.png",
  "/assets/profile-images/female_human_26.png",
  "/assets/profile-images/female_human_27.png",
  "/assets/profile-images/female_human_28.png",
  "/assets/profile-images/female_human_29.png",
  "/assets/profile-images/female_human_30.png",
  "/assets/profile-images/female_human_31.png",
  "/assets/profile-images/female_human_32.png",
  "/assets/profile-images/female_human_33.png",
  "/assets/profile-images/female_human_34.png",
  "/assets/profile-images/female_human_35.png",
  "/assets/profile-images/female_human_36.png",
  "/assets/profile-images/female_human_37.png",
  "/assets/profile-images/female_human_38.png",
  "/assets/profile-images/female_human_39.png",
  "/assets/profile-images/female_human_40.png",
  "/assets/profile-images/female_human_41.png",
  "/assets/profile-images/female_human_42.png",
  "/assets/profile-images/female_human_43.png",
  "/assets/profile-images/female_human_44.png",
  "/assets/profile-images/female_human_45.png",
  "/assets/profile-images/female_human_46.png",
  "/assets/profile-images/female_human_47.png",
  "/assets/profile-images/female_human_48.png",
  "/assets/profile-images/female_human_49.png",
  "/assets/profile-images/female_human_50.png",
];
const PROFILE_IMAGES = [...MALE_IMAGES, ...FEMALE_IMAGES];

const BOT_CONFIGS = [
  { name: "Beginner Bot", image: "/assets/BEGINNER-BOT-BG.png", difficulty: "EASY", color: "#10b981", desc: "Steady compiler" },
  { name: "Lazy Compiler", image: "/assets/LAZY-COMPILER-BG.png", difficulty: "EASY", color: "#f59e0b", desc: "Slow logic analysis" },
  { name: "Logic Bot", image: "/assets/LOGIC-BOT-BG.png", difficulty: "MED", color: "#3b82f6", desc: "Balanced performance" },
  { name: "Flash Coder", image: "/assets/FLASH-CODER-BG.png", difficulty: "HARD", color: "#8b5cf6", desc: "High-speed processing" },
  { name: "Test Case Destroyer", image: "/assets/TEST-CASE-DESTROYER-BG.png", difficulty: "EXPERT", color: "#ef4444", desc: "Unforgiving optimizer" },
];

const THEMES = {
  red: {
    accent: "#ff5252",
    ui: "#ff6b6b",
    glow: "rgba(255, 82, 82, 0.08)",
    background: "radial-gradient(circle at 50% 30%, rgba(255, 82, 82, 0.15), #060002 55%, #020001 100%)",
  },
  blue: {
    accent: "#0099ff",
    ui: "#00ccff",
    glow: "rgba(0, 153, 255, 0.08)",
    background: "radial-gradient(circle at 50% 30%, rgba(0, 153, 255, 0.15), #00040f 55%, #000206 100%)",
  },
  green: {
    accent: "#00ff88",
    ui: "#00ff99",
    glow: "rgba(0, 255, 136, 0.06)",
    background: "radial-gradient(circle at 50% 30%, rgba(0, 255, 136, 0.12), #000604 55%, #000201 100%)",
  },
  purple: {
    accent: "#a855f7",
    ui: "#d8b4fe",
    glow: "rgba(168, 85, 247, 0.08)",
    background: "radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.15), #030008 55%, #010003 100%)",
  },
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const currentTheme = THEMES[themeKey] || THEMES.purple;

  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  // Profile data states
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [uid, setUid] = useState("");
  const [bio, setBio] = useState("Add some things about you");
  const [selectedImage, setSelectedImage] = useState(PROFILE_IMAGES[0]);
  
  const [xpPoints, setXpPoints] = useState(0);
  const [gThunderPoints, setGThunderPoints] = useState(0);
  const [rankPoints, setRankPoints] = useState(0);
  const [tournamentSummary, setTournamentSummary] = useState(null);
  const [bugHunterSummary, setBugHunterSummary] = useState(null);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [nameChangeCount, setNameChangeCount] = useState(0);
  const [isPublic, setIsPublic] = useState(true);

  // Stats arrays
  const [winsVsBots, setWinsVsBots] = useState([0, 0, 0, 0, 0]);
  const [lossesVsBots, setLossesVsBots] = useState([0, 0, 0, 0, 0]);
  const [completedLevelsCount, setCompletedLevelsCount] = useState(0);

  // Edit fields temporary states
  const [tempFullName, setTempFullName] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempBio, setTempBio] = useState("");
  const [tempImage, setTempImage] = useState(PROFILE_IMAGES[0]);

  // Search profile
  const [searchUid, setSearchUid] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isViewingOther, setIsViewingOther] = useState(false);

  // Skill trees phase completion
  const [htmlPhases, setHtmlPhases] = useState(Array(10).fill(0));
  const [cssPhases, setCssPhases] = useState(Array(10).fill(0));
  const [jsPhases, setJsPhases] = useState(Array(10).fill(0));
  const [pythonPhases, setPythonPhases] = useState(Array(10).fill(0));
  const [javaPhases, setJavaPhases] = useState(Array(10).fill(0));
  const [courseLevelTotals, setCourseLevelTotals] = useState({});
  const [totalMissionCount, setTotalMissionCount] = useState(null);

  const maxNameChanges = 3;

  // Level computation logic
  const getLevelFromXp = (xp) => Math.floor((xp || 0) / 1000) + 1;
  const getXpProgress = (xp) => {
    const val = xp || 0;
    const currentLvl = getLevelFromXp(val);
    const xpInLevel = val % 1000;
    const percentage = Math.floor((xpInLevel / 1000) * 100);
    return { currentLvl, xpInLevel, percentage };
  };

  const displayedRankPoints = isViewingOther ? Number(searchResult?.rankPoints) || 0 : rankPoints;
  const currentRank = RANK_TIERS.find(t => displayedRankPoints >= t.min && (t.max === null || displayedRankPoints < t.max)) || RANK_TIERS[0];
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const [profileRes, levelsRes] = await Promise.all([
          profileAPI.getProfile(),
          levelsAPI.getProgress()
        ]);
        const [tournamentResult, bugHunterResult, historyResult] = await Promise.allSettled([
          tournamentAPI.getProfile(),
          bugHunterAPI.getStats(),
          pointsAPI.getHistory({ limit: 16 }),
        ]);
        if (tournamentResult.status === 'fulfilled') setTournamentSummary(tournamentResult.value.data);
        if (bugHunterResult.status === 'fulfilled') setBugHunterSummary(bugHunterResult.value.data);
        if (historyResult.status === 'fulfilled') setRewardHistory(historyResult.value.data.transactions || []);

        const u = profileRes.data.user;
        const prog = levelsRes.data.levelProgress;
        const compList = levelsRes.data.completedLevels || [];
        const phaseLevelCounts = levelsRes.data.phaseLevelCounts || {};
        const courseTotals = Object.fromEntries(Object.entries(phaseLevelCounts).map(([course, phases]) => [
          course,
          Object.values(phases).reduce((total, count) => total + (Number(count) || 0), 0),
        ]));
        setCourseLevelTotals(courseTotals);
        setTotalMissionCount(Object.values(courseTotals).reduce((total, count) => total + count, 0));

        setCompletedLevelsCount(compList.length);

        if (prog) {
          // Convert each stored next-unlocked level into completed levels, using
          // the server's current phase size so the profile follows curriculum growth.
          const calculatePhases = (courseKey) => {
            const counts = phaseLevelCounts[courseKey] || {};
            return Array(curriculumLimits.phaseCount).fill(0).map((_, idx) => {
              const phaseNum = idx + 1;
              const nextUnlocked = Number(prog[courseKey]?.[`phase${phaseNum}`]) || 0;
              const phaseSize = Number(counts[`phase${phaseNum}`]) || 0;
              return Math.min(Math.max(nextUnlocked - 1, 0), phaseSize);
            });
          };

          setHtmlPhases(calculatePhases("html"));
          setCssPhases(calculatePhases("css"));
          setJsPhases(calculatePhases("javascript"));
          setPythonPhases(calculatePhases("python"));
          setJavaPhases(calculatePhases("java"));
        }

        // Setup check
        if (!u.profileSetupComplete || !u.username) {
          setIsSetupMode(true);
          setIsEditing(true);
          setFullName(u.name || "");
          setTempFullName(u.name || "");
          setTempUsername("");
          setTempGender("");
          setTempBio("Add some things about you");
          setTempImage(PROFILE_IMAGES[1]);
        } else {
          setFullName(u.name);
          setUsername(u.username);
          setUid(u.uid);
          setBio(u.bio);
          setSelectedImage(u.profileImage);
          setXpPoints(u.xpPoints || 0);
          setGThunderPoints(u.gThunderPoints || 0);
          setRankPoints(u.rankPoints || 0);
          setIsPublic(u.isPublic);
          setNameChangeCount(u.nameChangeCount || 0);

          if (u.winsVsBots) setWinsVsBots(u.winsVsBots);
          if (u.lossesVsBots) setLossesVsBots(u.lossesVsBots);

          setTempFullName(u.name);
          setTempUsername(u.username);
          setTempGender(u.gender || "");
          setTempBio(u.bio);
          setTempImage(u.profileImage);

          localStorage.setItem('profileImage', u.profileImage || '');
          localStorage.setItem('username', u.username || '');
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  useEffect(() => {
    const refreshBalancesAndHistory = async () => {
      const [pointsResult, historyResult] = await Promise.allSettled([
        pointsAPI.getInfo(),
        pointsAPI.getHistory({ limit: 16 }),
      ]);
      if (pointsResult.status === 'fulfilled') {
        setXpPoints(pointsResult.value.data.xpPoints || 0);
        setGThunderPoints(pointsResult.value.data.gThunderPoints || 0);
      }
      if (historyResult.status === 'fulfilled') setRewardHistory(historyResult.value.data.transactions || []);
    };
    window.addEventListener('pointsUpdated', refreshBalancesAndHistory);
    return () => window.removeEventListener('pointsUpdated', refreshBalancesAndHistory);
  }, []);

  const handleSearch = async () => {
    if (!searchUid.trim()) {
      alert("Please enter a UID to initiate scanning.");
      return;
    }
    if (searchUid === uid) {
      alert("Self-scan aborted. This is your user signature.");
      return;
    }
    try {
      const res = await profileAPI.searchUserByUid(searchUid);
      const found = res.data.user;
      setSearchResult({
        fullName: found.name,
        username: found.username,
        uid: found.uid,
        bio: found.bio,
        image: found.profileImage,
        rankPoints: found.rankPoints,
        winsVsBots: found.winsVsBots || [0, 0, 0, 0, 0],
        lossesVsBots: found.lossesVsBots || [0, 0, 0, 0, 0],
        xpPoints: found.xpPoints || 0,
        isPublic: true
      });
      setIsViewingOther(true);
    } catch (error) {
      if (error.response?.status === 404) {
        alert("Search Failure. No nodes found matching UID: " + searchUid);
      } else if (error.response?.status === 403) {
        alert("Access Denied. Target user node is configured in secure privacy mode.");
      } else {
        alert("Scanning error. Check network connection.");
      }
      console.error(error);
    }
  };

  const handleBackToMyProfile = () => {
    setIsViewingOther(false);
    setSearchResult(null);
    setSearchUid("");
  };

  const handleSave = async () => {
    if (!tempFullName.trim() || !tempUsername.trim()) {
      alert("Database error: Name and Username keys cannot be blank.");
      return;
    }
    if (isSetupMode && !tempGender) {
      alert("Database error: Gender selection key required.");
      return;
    }
    const nameChanged = (tempFullName !== fullName) || (tempUsername !== username);
    if (!isSetupMode && nameChanged && nameChangeCount >= maxNameChanges) {
      alert(`Access Blocked: Maximum name change limit (${maxNameChanges}) reached.`);
      return;
    }

    try {
      let res;
      if (isSetupMode) {
        res = await profileAPI.setupProfile({
          fullName: tempFullName,
          username: tempUsername,
          gender: tempGender,
          bio: tempBio,
          profileImage: tempImage
        });
        setIsSetupMode(false);
      } else {
        res = await profileAPI.updateProfile({
          fullName: tempFullName,
          username: tempUsername,
          bio: tempBio,
          profileImage: tempImage,
          isPublic
        });
      }

      const u = res.data.user;
      setFullName(u.name);
      setUsername(u.username);
      setUid(u.uid);
      setBio(u.bio);
      setSelectedImage(u.profileImage);
      setNameChangeCount(u.nameChangeCount);
      setIsPublic(u.isPublic);
      setIsEditing(false);

      localStorage.setItem('profileImage', u.profileImage || '');
      localStorage.setItem('username', u.username || '');

      window.dispatchEvent(new Event('profileUpdated'));
      alert("Neural sync complete. Profile node rewritten successfully!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Sync failed. Retry profile configuration.");
    }
  };

  const handleCancel = () => {
    if (isSetupMode) {
      alert("Initial node configuration required to navigate.");
      return;
    }
    setTempFullName(fullName);
    setTempUsername(username);
    setTempBio(bio);
    setTempImage(selectedImage);
    setIsEditing(false);
  };

  const activeXp = isViewingOther ? searchResult.xpPoints : xpPoints;
  const activeLevel = getLevelFromXp(activeXp);
  const activeXpProgress = getXpProgress(activeXp);

  const activeWinsVsBots = isViewingOther ? searchResult.winsVsBots : winsVsBots;
  const activeLossesVsBots = isViewingOther ? searchResult.lossesVsBots : lossesVsBots;
  const activeTotalWins = activeWinsVsBots.reduce((a, b) => a + b, 0);
  const activeTotalLosses = activeLossesVsBots.reduce((a, b) => a + b, 0);
  const activeWinRate = activeTotalWins + activeTotalLosses > 0 ? Math.round((activeTotalWins / (activeTotalWins + activeTotalLosses)) * 100) : 0;

  // Skill pentagon SVG calculation (interactive Skill Tree Wheel)
  const drawSkillTreeSvg = () => {
    const size = 300;
    const center = size / 2;
    const radius = 95;
    
    // Core details
    const languages = [
      { id: 'html', name: "HTML", color: "#ff5252", phases: htmlPhases },
      { id: 'css', name: "CSS", color: "#0099ff", phases: cssPhases },
      { id: 'javascript', name: "JS", color: "#f7df1e", phases: jsPhases },
      { id: 'python', name: "PYTHON", color: "#3776ab", phases: pythonPhases },
      { id: 'java', name: "JAVA", color: "#f89820", phases: javaPhases },
    ];

    const vertices = languages.map((lang, idx) => {
      const angle = (Math.PI * 2 * idx) / 5 - Math.PI / 2;
      const totalComp = lang.phases.reduce((sum, p) => sum + p, 0);
      const totalLevels = courseLevelTotals[lang.id] || 0;
      // Base radius of 0.05 for visibility, remaining 0.95 scales with completion
      const completionRatio = 0.05 + (totalLevels ? Math.min(totalComp / totalLevels, 1.0) * 0.95 : 0);
      
      const cx = center + radius * Math.cos(angle);
      const cy = center + radius * Math.sin(angle);
      const valX = center + (radius * completionRatio) * Math.cos(angle);
      const valY = center + (radius * completionRatio) * Math.sin(angle);

      return { ...lang, cx, cy, valX, valY, totalComp, totalLevels };
    });

    const webLinePath = Array.from({ length: 4 }, (_, step) => {
      const currentRadius = radius * ((step + 1) / 4);
      return Array.from({ length: 5 }, (_, idx) => {
        const angle = (Math.PI * 2 * idx) / 5 - Math.PI / 2;
        const x = center + currentRadius * Math.cos(angle);
        const y = center + currentRadius * Math.sin(angle);
        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
      }).join(' ') + ' Z';
    }).join(' ');

    const skillFillPoints = vertices.map(v => `${v.valX},${v.valY}`).join(' ');

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto select-none">
        {/* Core grids webs */}
        <path d={webLinePath} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
        
        {/* Outer connection nodes */}
        {vertices.map((v, idx) => {
          const nextV = vertices[(idx + 1) % 5];
          return (
            <line
              key={idx}
              x1={v.cx}
              y1={v.cy}
              x2={nextV.cx}
              y2={nextV.cy}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          );
        })}

        {/* Center spoke beams */}
        {vertices.map((v, idx) => (
          <line
            key={idx}
            x1={center}
            y1={center}
            x2={v.cx}
            y2={v.cy}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Dynamic skills polygons fill */}
        <polygon
          points={skillFillPoints}
          fill={`${currentTheme.accent}25`}
          stroke={currentTheme.accent}
          strokeWidth="2.5"
          className="transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 6px ${currentTheme.accent})` }}
        />

        {/* Skill vertices core node badges */}
        {vertices.map((v, idx) => (
          <g key={idx} className="cursor-pointer group">
            <circle
              cx={v.valX}
              cy={v.valY}
              r="4.5"
              fill={v.color}
              stroke="white"
              strokeWidth="1.5"
              style={{ filter: `drop-shadow(0 0 4px ${v.color})` }}
            />
            {/* Outline nodes */}
            <circle
              cx={v.cx}
              cy={v.cy}
              r="14"
              fill="#06020c"
              stroke={v.color}
              strokeWidth="2"
              className="hover:scale-110 transition-transform duration-300"
              style={{ filter: `drop-shadow(0 0 3px ${v.color}50)` }}
            />
            <text
              x={v.cx}
              y={v.cy + 3}
              textAnchor="middle"
              fill="white"
              fontSize="7.5"
              fontWeight="900"
              className="pointer-events-none font-mono"
            >
              {v.name}
            </text>
            
            {/* Mini HUD Info Overlay (appears on hover) */}
            <rect
              x={v.cx - 35}
              y={v.cy - 34}
              width="70"
              height="16"
              rx="4"
              fill="rgba(0,0,0,0.85)"
              stroke={v.color}
              strokeWidth="1"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            />
            <text
              x={v.cx}
              y={v.cy - 23}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-mono"
            >
              {v.totalComp}/{v.totalLevels} LEVELS
            </text>
          </g>
        ))}

        {/* Core Center Emblem */}
        <circle cx={center} cy={center} r="6" fill="#0c071a" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: currentTheme.background, color: 'white' }}>
      {/* SCANLINE / Matrix HUD Grid Backdrops */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "26px 26px"
        }}
      />
      <div className="absolute inset-0 bg-scanlines pointer-events-none z-0 opacity-[0.07]" />

      <CustomCursor theme={currentTheme} />

      <Navbar 
        currentPage="profile"
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        themes={THEMES}
        currentTheme={currentTheme}
      />

      <main className="flex-1 px-4 py-10 sm:px-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-current animate-spin" style={{ color: currentTheme.accent }}></div>
                <div className="absolute inset-3 rounded-full border-4 border-solid border-current border-t-transparent animate-spin-reverse" style={{ color: currentTheme.ui }}></div>
              </div>
              <p className="mt-8 font-techno text-lg uppercase tracking-widest text-white/70 animate-pulse">Initializing System Nodes...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOP HEADER: Dynamic HUD status widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1: Rank Tier */}
                <div 
                  className="rounded-xl p-4 flex items-center justify-between shadow-lg border backdrop-blur-md transition-all hover:scale-102"
                  style={{
                    background: "rgba(8, 8, 12, 0.85)",
                    border: `1px solid ${currentTheme.accent}25`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5)`
                  }}
                >
                  <div>
                    <p className="text-white/50 text-xs font-mono tracking-wider uppercase">CLAN RATING</p>
                    <p className="font-techno text-lg font-black tracking-wide mt-1" style={{ color: currentRank.color }}>{currentRank.name}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">{isViewingOther ? searchResult.rankPoints : rankPoints} RP</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-3xl shadow-inner" style={{ background: `${currentRank.color}25` }}>
                    <PremiumIcon name={currentRank.iconName} size={28} color={currentRank.color} />
                  </div>
                </div>

                {/* 2: XP Level */}
                <div 
                  className="rounded-xl p-4 flex items-center justify-between shadow-lg border backdrop-blur-md transition-all hover:scale-102"
                  style={{
                    background: "rgba(8, 8, 12, 0.85)",
                    border: `1px solid ${currentTheme.accent}25`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5)`
                  }}
                >
                  <div>
                    <p className="text-white/50 text-xs font-mono tracking-wider uppercase">RPG CODING LEVEL</p>
                    <p className="font-techno text-lg font-black text-white tracking-wide mt-1">LEVEL {activeLevel}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">{activeXpProgress.xpInLevel} / 1000 XP</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner" style={{ background: `${currentTheme.accent}20` }}>
                    <Shield className="w-6 h-6" style={{ color: currentTheme.accent }} />
                  </div>
                </div>

                {/* 3: G-Thunder Points */}
                <div 
                  className="rounded-xl p-4 flex items-center justify-between shadow-lg border backdrop-blur-md transition-all hover:scale-102"
                  style={{
                    background: "rgba(8, 8, 12, 0.85)",
                    border: `1px solid ${currentTheme.accent}25`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5)`
                  }}
                >
                  <div>
                    <p className="text-white/50 text-xs font-mono tracking-wider uppercase">⚡ ENERGY CORE</p>
                    <p className="font-techno text-lg font-black tracking-wide mt-1" style={{ color: currentTheme.ui }}>
                      {isViewingOther ? "N/A" : gThunderPoints} G-THUNDER
                    </p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">Energy units</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner animate-pulse" style={{ background: `${currentTheme.ui}20` }}>
                    <Zap className="w-6 h-6" style={{ color: currentTheme.ui }} />
                  </div>
                </div>

                {/* 4: Total Single Player Missions Completed */}
                <div 
                  className="rounded-xl p-4 flex items-center justify-between shadow-lg border backdrop-blur-md transition-all hover:scale-102"
                  style={{
                    background: "rgba(8, 8, 12, 0.85)",
                    border: `1px solid ${currentTheme.accent}25`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5)`
                  }}
                >
                  <div>
                    <p className="text-white/50 text-xs font-mono tracking-wider uppercase">COMPLETED MISSIONS</p>
                    <p className="font-techno text-lg font-black text-white tracking-wide mt-1">
                      {isViewingOther ? "UNAVAILABLE" : `${completedLevelsCount} LEVELS`}
                    </p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">Single-player Tree</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Activity className="w-6 h-6 text-white/60" />
                  </div>
                </div>
              </div>

              {/* SEARCH CONTAINER BAR */}
              {!isSetupMode && (
                <div className="relative group">
                  <div 
                    className="absolute -inset-1 rounded-full opacity-25 blur group-hover:opacity-40 transition duration-300"
                    style={{ background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.ui})` }}
                  />
                  <div 
                    className="relative flex items-center gap-3 rounded-full px-5 py-2.5 backdrop-blur-md shadow-2xl transition-all duration-300"
                    style={{ 
                      background: "rgba(8, 8, 12, 0.9)",
                      border: `1px solid ${currentTheme.accent}30`,
                      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5)`
                    }}
                  >
                    <User className="w-5 h-5 flex-shrink-0" style={{ color: currentTheme.accent }} />
                    <input
                      type="text"
                      value={searchUid}
                      onChange={(e) => setSearchUid(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="SCAN NETWORK VIA USER UID (e.g. 123456)..."
                      className="flex-1 bg-transparent text-white font-mono text-sm placeholder-white/30 focus:outline-none"
                      style={{ border: "none" }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {searchUid && (
                      <button
                        onClick={() => {
                          setSearchUid('');
                          if (isViewingOther) handleBackToMyProfile();
                        }}
                        className="p-1 rounded-full hover:bg-white/10 text-white/40 transition"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={handleSearch}
                      className="px-5 py-2 rounded-full font-techno font-bold text-white text-xs uppercase transition-all hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.ui} 100%)`,
                        boxShadow: `0 0 10px ${currentTheme.accent}50`
                      }}
                    >
                      SEARCH
                    </button>
                    {isViewingOther && (
                      <button
                        onClick={handleBackToMyProfile}
                        className="px-5 py-2 rounded-full font-techno font-bold text-white text-xs uppercase bg-white/10 hover:bg-white/20 transition-all hover:scale-105"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* MAIN LAYOUT SPLIT: Left Profile Info - Right Skill Pentagon */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Player Identity console */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* IDENTITY CARD */}
                  <div
                    className="rounded-2xl shadow-xl overflow-hidden relative"
                    style={{
                      background: "rgba(8, 8, 12, 0.85)",
                      border: `1px solid ${currentTheme.accent}25`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `0 16px 45px rgba(0, 0, 0, 0.6), 0 0 15px ${currentTheme.accent}08`
                    }}
                  >
                    {/* Top matrix barcode grid header decoration */}
                    <div 
                      className="h-1.5 w-full bg-gradient-to-r"
                      style={{ backgroundImage: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.ui})` }}
                    />
                    
                    <div className="p-6 space-y-6">
                      {/* Avatar with dynamic spinning portal frame */}
                      <div className="flex flex-col items-center">
                        <div className="relative group">
                          {/* Pulsing ring outer */}
                          <div 
                            className="absolute inset-0 rounded-full blur-sm opacity-60 animate-ping pointer-events-none"
                            style={{ border: `2px solid ${currentTheme.accent}` }}
                          />
                          {/* Spinning portal outer outlines */}
                          <div 
                            className="absolute -inset-2.5 rounded-full border border-dashed animate-spin-slow pointer-events-none"
                            style={{ borderColor: `${currentTheme.accent}60` }}
                          />
                          <div 
                            className="absolute -inset-1.5 rounded-full border border-double animate-spin-reverse pointer-events-none"
                            style={{ borderColor: `${currentTheme.ui}60` }}
                          />
                          
                          {/* Inner Avatar picture frame */}
                          <div
                            className="w-28 h-28 rounded-full overflow-hidden border-3 relative z-10 bg-black/40"
                            style={{ borderColor: currentTheme.accent }}
                          >
                            <img
                              src={isViewingOther ? searchResult.image : (isEditing ? tempImage : selectedImage)}
                              alt="Player Avatar"
                              className="w-full h-full object-cover select-none"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%23a855f7' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        </div>

                        {/* RPG Role Title */}
                        <div className="mt-4 text-center">
                          <span 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-mono font-bold tracking-widest uppercase border bg-black/40"
                            style={{ color: currentTheme.ui, borderColor: `${currentTheme.ui}40` }}
                          >
                            <User className="w-3.5 h-3.5" />
                            {isViewingOther 
                              ? `@${searchResult?.username || 'unknown'}` 
                              : `@${username} • ${Math.max(0, maxNameChanges - nameChangeCount)} CHANGES LEFT`}
                          </span>
                        </div>
                      </div>

                      {/* RPG Experience bar HUD element */}
                      <div className="bg-black/35 rounded-xl p-4 border border-white/5 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-white/60">XP THRESHOLD</span>
                          <span className="font-bold text-white">{activeXpProgress.xpInLevel} / 1000 XP</span>
                        </div>
                        
                        <div className="w-full h-3.5 rounded-full overflow-hidden bg-white/5 border border-white/10 p-0.5 relative">
                          <div 
                            className="h-full rounded-full transition-all duration-700 relative bg-gradient-to-r"
                            style={{ 
                              width: `${activeXpProgress.percentage}%`,
                              backgroundImage: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.ui})` 
                            }}
                          >
                            {/* Scanning laser glow point */}
                            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white shadow-lg animate-pulse" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-3xs font-mono text-white/40">
                          <span>LVL {activeLevel}</span>
                          <span>{1000 - activeXpProgress.xpInLevel} XP UNTIL NEXT LEVEL UP</span>
                          <span>LVL {activeLevel + 1}</span>
                        </div>
                      </div>

                      {/* Profile details list panel */}
                      <div className="space-y-4 font-mono text-sm">
                        {isSetupMode && (
                          <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-400 font-bold text-xs">🚀 INITIAL SETUP REQUIRED</p>
                            <p className="text-white/60 text-2xs mt-1">Initialize username and details to unlock multiplayer lobby node links.</p>
                          </div>
                        )}

                        {isEditing ? (
                          <div className="space-y-3.5 text-left">
                            <div>
                              <label htmlFor="profile-full-name" className="text-white/50 text-2xs uppercase">FULL NAME</label>
                              <input
                                id="profile-full-name"
                                type="text"
                                value={tempFullName}
                                onChange={(e) => setTempFullName(e.target.value)}
                                placeholder="Enter Name..."
                                maxLength={80}
                                autoComplete="name"
                                className="w-full text-white bg-black/50 rounded-lg px-4 py-2 border mt-1 focus:outline-none"
                                style={{ borderColor: `${currentTheme.accent}50` }}
                                disabled={!isSetupMode && nameChangeCount >= maxNameChanges}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="profile-username" className="text-white/50 text-2xs uppercase">USERNAME</label>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-white/40">@</span>
                                <input
                                  id="profile-username"
                                  type="text"
                                  value={tempUsername}
                                  onChange={(e) => setTempUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                  placeholder="alias_key"
                                  maxLength={24}
                                  autoComplete="username"
                                  autoCapitalize="none"
                                  spellCheck={false}
                                  className="w-full text-white bg-black/50 rounded-lg px-3 py-1.5 border focus:outline-none"
                                  style={{ borderColor: `${currentTheme.accent}50` }}
                                  disabled={!isSetupMode && nameChangeCount >= maxNameChanges}
                                />
                              </div>
                            </div>

                            {isSetupMode && (
                              <fieldset className="min-w-0 border-0 p-0 m-0">
                                <legend className="text-white/50 text-2xs uppercase">GENDER</legend>
                                <div className="flex gap-2.5 mt-1">
                                  <button
                                    type="button"
                                    aria-pressed={tempGender === 'male'}
                                    onClick={() => setTempGender('male')}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all hover:scale-102 text-xs"
                                    style={{
                                      borderColor: tempGender === 'male' ? currentTheme.accent : 'rgba(255,255,255,0.06)',
                                      background: tempGender === 'male' ? `${currentTheme.accent}15` : 'rgba(255,255,255,0.02)',
                                      color: tempGender === 'male' ? currentTheme.accent : 'rgba(255,255,255,0.8)'
                                    }}
                                  >
                                    MALE
                                  </button>
                                  <button
                                    type="button"
                                    aria-pressed={tempGender === 'female'}
                                    onClick={() => setTempGender('female')}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all hover:scale-102 text-xs"
                                    style={{
                                      borderColor: tempGender === 'female' ? currentTheme.accent : 'rgba(255,255,255,0.06)',
                                      background: tempGender === 'female' ? `${currentTheme.accent}15` : 'rgba(255,255,255,0.02)',
                                      color: tempGender === 'female' ? currentTheme.accent : 'rgba(255,255,255,0.8)'
                                    }}
                                  >
                                    FEMALE
                                  </button>
                                </div>
                              </fieldset>
                            )}

                            <div>
                              <label htmlFor="profile-bio" className="text-white/50 text-2xs uppercase">BIO</label>
                              <textarea
                                id="profile-bio"
                                value={tempBio}
                                onChange={(e) => setTempBio(e.target.value)}
                                placeholder="Describe yourself..."
                                maxLength={300}
                                className="w-full text-white bg-black/50 rounded-lg px-4 py-2 border mt-1 resize-none focus:outline-none"
                                style={{ borderColor: `${currentTheme.accent}50` }}
                                rows={2.5}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                              <span className="text-white/50 text-xs">FULL NAME</span>
                              <span className="text-white font-bold">{isViewingOther ? searchResult.fullName : fullName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                              <span className="text-white/50 text-xs">USERNAME</span>
                              <span className="text-white/80">@{isViewingOther ? searchResult.username : username}</span>
                            </div>
                            {uid && (
                              <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                                <span className="text-white/50 text-xs">USER ID</span>
                                <span className="text-white font-mono font-bold tracking-widest text-xs" style={{ color: currentTheme.ui }}>
                                  #{isViewingOther ? searchResult.uid : uid}
                                </span>
                              </div>
                            )}
                            <div className="space-y-1.5 py-1">
                              <span className="text-white/50 text-xs block">BIO</span>
                              <p className="text-white/70 text-xs leading-relaxed italic bg-black/20 p-3 rounded-lg border border-white/5">
                                {isViewingOther ? searchResult.bio : bio}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Config Button Controls */}
                      <div className="flex items-center gap-2 mt-4">
                        {!isViewingOther && (isEditing ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-techno font-bold text-white uppercase text-xs transition-all hover:scale-103"
                              style={{ 
                                background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.ui} 100%)`,
                                boxShadow: `0 0 10px ${currentTheme.accent}50`
                              }}
                            >
                              <Check className="w-4 h-4" />
                              SAVE PROFILE
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2.5 rounded-lg font-techno font-bold text-white uppercase text-xs transition-all hover:scale-103 bg-white/5 border border-white/10 hover:bg-white/10"
                            >
                              CANCEL
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-techno font-bold text-white uppercase text-xs transition-all hover:scale-103 bg-white/5 border border-white/10 hover:bg-white/10"
                            >
                              <Edit2 className="w-4 h-4" />
                              EDIT PROFILE
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const newIsPublic = !isPublic;
                                  await profileAPI.updateProfile({ isPublic: newIsPublic });
                                  setIsPublic(newIsPublic);
                                } catch (error) {
                                  alert("Encryption error during privacy configuration toggle.");
                                  console.error(error);
                                }
                              }}
                              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-techno font-bold text-white uppercase text-xs transition-all hover:scale-103"
                              style={{ 
                                background: isPublic ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                border: `1px solid ${isPublic ? "#10B981" : "#ef4444"}`,
                                color: isPublic ? "#10B981" : "#ef4444",
                                textShadow: `0 0 5px ${isPublic ? "#10B981" : "#ef4444"}50`
                              }}
                            >
                              {isPublic ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              {isPublic ? "PUBLIC LOG" : "STEALTH LOG"}
                            </button>
                          </>
                        ))}
                      </div>
                    </div>

                    {/* Profile avatar picker selection panel */}
                    {!isViewingOther && isEditing && (
                      <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20">
                        <p className="font-techno text-2xs font-bold uppercase tracking-wider mb-3 text-white/60">
                          SELECT PROFILE PICTURE
                        </p>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                          {(tempGender === "female" ? FEMALE_IMAGES : MALE_IMAGES).map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setTempImage(img)}
                              className="w-11 h-11 rounded-full overflow-hidden border-2 flex-shrink-0 transition-all hover:scale-110"
                              style={{
                                borderColor: tempImage === img ? currentTheme.accent : "rgba(255, 255, 255, 0.12)",
                                opacity: tempImage === img ? 1 : 0.45,
                                boxShadow: tempImage === img ? `0 0 8px ${currentTheme.accent}80` : 'none',
                              }}
                            >
                              <img
                                src={img}
                                alt={`Portrait ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DAILY OPS WIDGET */}
                  {!isViewingOther && (
                    <DailyRewards theme={currentTheme} />
                  )}
                </div>

                {/* RIGHT COLUMN: Holographic Skill Pentagon & Levels Mode */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Skill wheel console */}
                  <div
                    className="rounded-2xl p-6 shadow-xl relative"
                    style={{
                      background: "rgba(8, 8, 12, 0.85)",
                      border: `1px solid ${currentTheme.accent}25`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `0 16px 45px rgba(0, 0, 0, 0.6), 0 0 15px ${currentTheme.accent}08`
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>
                          MAINFRAME SKILL CORE
                        </h3>
                        <p className="text-white/40 text-2xs font-mono mt-0.5">Interactive code vector telemetry</p>
                      </div>
                      <Award className="w-5 h-5" style={{ color: currentTheme.accent }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-6 max-w-xs mx-auto w-full">
                        {drawSkillTreeSvg()}
                      </div>
                      
                      {/* Language completion ratios */}
                      <div className="md:col-span-6 space-y-3.5 font-mono text-2xs">
                        {[
                          { id: 'html', name: "HTML CORE MASTER", phases: htmlPhases, color: "#ff5252" },
                          { id: 'css', name: "CSS ARCHITECTURE", phases: cssPhases, color: "#0099ff" },
                          { id: 'javascript', name: "JAVASCRIPT MATRIX", phases: jsPhases, color: "#f7df1e" },
                          { id: 'python', name: "PYTHON SCRIPTS ENGINE", phases: pythonPhases, color: "#3776ab" },
                          { id: 'java', name: "JAVA COMPILER LOGIC", phases: javaPhases, color: "#f89820" },
                        ].map((core) => {
                          const completed = core.phases.reduce((sum, p) => sum + p, 0);
                          const totalLevels = courseLevelTotals[core.id] || 0;
                          const total = totalLevels ? Math.round((completed / totalLevels) * 100) : null;
                          return (
                            <div key={core.name} className="space-y-1">
                              <div className="flex justify-between text-white/70">
                                <span>{core.name}</span>
                                <span className="font-bold" style={{ color: core.color }}>{total === null ? (isLoading ? '…' : '—') : `${total}%`}</span>
                              </div>
                              <div className="w-full h-2 rounded bg-white/5 border border-white/10 p-0.5">
                                <div 
                                  className="h-full rounded transition-all duration-700" 
                                  style={{ width: `${total}%`, backgroundColor: core.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Single-Player Levels Mode Phase Node Grid */}
                  <div
                    className="rounded-2xl p-6 shadow-xl relative"
                    style={{
                      background: "rgba(8, 8, 12, 0.85)",
                      border: `1px solid ${currentTheme.accent}25`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `0 16px 45px rgba(0, 0, 0, 0.6)`
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>
                          MISSION LEVELS MATRIX
                        </h3>
                        <p className="text-white/40 text-2xs font-mono mt-0.5">{totalMissionCount === null ? (isLoading ? 'Loading curriculum…' : 'Curriculum unavailable') : `${totalMissionCount} total system mission nodes`}</p>
                      </div>
                      <Flame className="w-5 h-5 animate-pulse" style={{ color: currentTheme.accent }} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      {[
                        { id: 'html', name: "HTML", color: "#ff5252", phases: htmlPhases },
                        { id: 'css', name: "CSS", color: "#0099ff", phases: cssPhases },
                        { id: 'javascript', name: "JAVASCRIPT", color: "#f7df1e", phases: jsPhases },
                        { id: 'python', name: "PYTHON", color: "#3776ab", phases: pythonPhases },
                        { id: 'java', name: "JAVA", color: "#f89820", phases: javaPhases },
                      ].map((course) => {
                        const sumCompleted = course.phases.reduce((sum, p) => sum + p, 0);
                        const totalLevels = courseLevelTotals[course.id] || 0;
                        return (
                          <div 
                            key={course.name} 
                            className="bg-black/30 rounded-xl p-3 border border-white/5 text-center flex flex-col justify-between items-center transition-all hover:scale-103 hover:bg-black/40"
                          >
                            <span className="font-techno font-bold text-2xs tracking-wide block" style={{ color: course.color }}>
                              {course.name}
                            </span>
                            <span className="text-white font-mono text-sm font-bold block mt-1.5">
                              {sumCompleted}/{totalLevels}
                            </span>
                            <span className="text-white/30 font-mono text-3xs mt-0.5 block uppercase">
                              Nodes
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rank League Ladder Table */}
                  <div
                    className="rounded-2xl p-6 shadow-xl relative"
                    style={{
                      background: "rgba(8, 8, 12, 0.85)",
                      border: `1px solid ${currentTheme.accent}25`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `0 16px 45px rgba(0, 0, 0, 0.6)`
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>
                          RANKED TIERS MAIN DATABASE
                        </h3>
                        <p className="text-white/40 text-2xs font-mono mt-0.5">Global tournament brackets</p>
                      </div>
                      <Trophy className="w-5 h-5" style={{ color: currentTheme.accent }} />
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {RANK_TIERS.map((tier) => {
                        const isCurrent = displayedRankPoints >= tier.min && (tier.max === null || displayedRankPoints < tier.max);
                        const isAchieved = displayedRankPoints >= tier.min;
                        return (
                          <div 
                            key={tier.name}
                            className="flex items-center justify-between px-4 py-2 rounded-xl transition-all font-mono"
                            style={{
                              background: isCurrent ? `${currentTheme.accent}15` : 'rgba(255, 255, 255, 0.01)',
                              border: isCurrent ? `1px solid ${currentTheme.accent}50` : '1px solid rgba(255, 255, 255, 0.03)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"
                                style={{ 
                                  borderColor: isAchieved ? tier.color : undefined,
                                  background: isAchieved ? `${tier.color}15` : undefined
                                }}>
                                <PremiumIcon name={tier.iconName} size={24} color={isAchieved ? tier.color : "rgba(255,255,255,0.4)"} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.name}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded text-3xs font-bold uppercase tracking-widest" style={{ background: currentTheme.accent, color: 'white' }}>
                                  ACTIVE BRACKET
                                </span>
                              )}
                            </div>
                        <span className="text-2xs text-white/50">{tier.min} - {tier.max === null ? "∞" : tier.max} RP</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {!isViewingOther && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
                  <section className="rounded-2xl p-6 shadow-xl" style={{ background: 'rgba(8, 8, 12, 0.85)', border: `1px solid ${currentTheme.accent}25` }} aria-labelledby="profile-tournament-heading">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 id="profile-tournament-heading" className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>TOURNAMENT SEASON</h3>
                        <p className="text-white/45 text-xs font-mono mt-1">{tournamentSummary?.currentSeason ? `SEASON ${tournamentSummary.currentSeason.seasonNumber}` : 'SEASON 0'} · competitive RP only</p>
                      </div>
                      <Trophy className="w-5 h-5 shrink-0" style={{ color: currentTheme.accent }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                      {[
                        ['RANK POINTS', tournamentSummary?.rankPoints ?? rankPoints],
                        ['WINS', tournamentSummary?.seasonStats?.wins ?? 0],
                        ['LOSSES', tournamentSummary?.seasonStats?.losses ?? 0],
                        ['DRAWS', tournamentSummary?.seasonStats?.draws ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-white/5 p-3">
                          <p className="text-[10px] text-white/45 font-mono">{label}</p>
                          <p className="text-white font-techno font-bold text-lg mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4" aria-label="Historical tournament seasons">
                      <p className="text-[10px] text-white/45 font-mono tracking-wider">PAST SEASON RESULTS</p>
                      {tournamentSummary?.seasonHistory?.length ? (
                        <div className="grid sm:grid-cols-2 gap-x-5 mt-2">
                          {tournamentSummary.seasonHistory.map((season) => (
                            <div key={season.seasonId} className="flex items-center justify-between gap-3 py-2 border-b border-white/[.06] text-xs">
                              <span className="text-white/65">Season {season.seasonNumber}<small className="block text-white/35 mt-0.5">{season.wins} W · {season.losses} L · {season.draws} D</small></span>
                              <span className="text-right"><strong className="text-white">#{season.finalRank}</strong><small className="block text-white/45 mt-0.5">{season.rankPoints} RP</small></span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-white/40 mt-2">Closed season results will be saved here.</p>}
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4" aria-label="Recent tournament match history">
                      <p className="text-[10px] text-white/45 font-mono tracking-wider">RECENT RANKED BATTLES</p>
                      {tournamentSummary?.recentMatches?.filter((match) => match.status !== 'active').length ? (
                        <div className="mt-2">
                          {tournamentSummary.recentMatches.filter((match) => match.status !== 'active').slice(0, 5).map((match) => {
                            const opponent = match.players?.find((player) => !player.isYou);
                            const playerId = match.players?.find((player) => player.isYou)?.userId;
                            const rpChange = match.rpDeltas?.find((entry) => entry.userId === playerId)?.amount || 0;
                            const outcome = match.result === 'win' ? 'VICTORY' : match.result === 'loss' ? 'DEFEAT' : match.result === 'draw' ? 'DRAW' : 'CANCELLED';
                            return (
                              <div key={match.matchId} className="flex items-center justify-between gap-3 py-2 border-b border-white/[.06] text-xs">
                                <span className="min-w-0 text-white/70"><strong className="block">{outcome} · vs {opponent?.username || 'Opponent'}</strong><small className="block text-white/35 mt-1">{match.language} · {match.difficulty}</small></span>
                                <span className="shrink-0 text-right"><strong className={rpChange > 0 ? 'text-emerald-200' : 'text-white/55'}>{rpChange > 0 ? `+${rpChange}` : '0'} RP</strong><small className="block text-white/35 mt-1">{match.finalizedAt ? new Date(match.finalizedAt).toLocaleDateString() : '—'}</small></span>
                              </div>
                            );
                          })}
                        </div>
                      ) : <p className="text-xs text-white/40 mt-2">Finalized tournament battles will appear here.</p>}
                    </div>
                    <button type="button" onClick={() => navigate('/tournament')} className="mt-5 rounded-lg px-4 py-2 text-xs font-bold tracking-wider text-white focus-visible:outline focus-visible:outline-2" style={{ background: currentTheme.accent }}>
                      OPEN TOURNAMENT MODE
                    </button>
                  </section>

                  <section className="rounded-2xl p-6 shadow-xl" style={{ background: 'rgba(8, 8, 12, 0.85)', border: `1px solid ${currentTheme.accent}25` }} aria-labelledby="profile-bughunter-heading">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 id="profile-bughunter-heading" className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>BUG HUNTER RECORD</h3>
                        <p className="text-white/45 text-xs font-mono mt-1">Reward XP is separate from competitive rank.</p>
                      </div>
                      <Bug className="w-5 h-5 shrink-0" style={{ color: currentTheme.accent }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                      {[
                        ['SOLVED', bugHunterSummary?.completed ?? 0],
                        ['ATTEMPTED', bugHunterSummary?.attempted ?? 0],
                        ['SUCCESS', `${bugHunterSummary?.successRate ?? 0}%`],
                        ['XP EARNED', bugHunterSummary?.xpEarned ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-white/5 p-3">
                          <p className="text-[10px] text-white/45 font-mono">{label}</p>
                          <p className="text-white font-techno font-bold text-lg mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => navigate('/bug-hunter')} className="mt-5 rounded-lg px-4 py-2 text-xs font-bold tracking-wider text-white focus-visible:outline focus-visible:outline-2" style={{ background: currentTheme.accent }}>
                      ENTER BUG HUNTER ARENA
                    </button>
                  </section>
                </div>
              )}

              {!isViewingOther && (
                <section className="rounded-2xl p-6 shadow-xl mb-6" style={{ background: 'rgba(8, 8, 12, 0.85)', border: `1px solid ${currentTheme.accent}25` }} aria-labelledby="profile-reward-history-heading">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h3 id="profile-reward-history-heading" className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>REWARD HISTORY</h3>
                      <p className="text-white/45 text-xs font-mono mt-1">XP and competitive RP are tracked as separate balances.</p>
                    </div>
                    <span className="text-[10px] text-white/35">Older balance changes are not reconstructed into this ledger.</span>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-5 mt-5">
                    {[
                      { currency: 'xp', title: 'XP TRANSACTIONS', unit: 'XP' },
                      { currency: 'rp', title: 'RANK POINT TRANSACTIONS', unit: 'RP' },
                    ].map(({ currency, title, unit }) => {
                      const items = rewardHistory.filter((item) => item.currency === currency);
                      return (
                        <div key={currency} className="rounded-xl border border-white/10 bg-white/[.025] p-4">
                          <h4 className="text-xs font-mono tracking-widest text-white/55">{title}</h4>
                          {items.length ? (
                            <ul className="mt-3 divide-y divide-white/[.07]">
                              {items.slice(0, 8).map((item) => (
                                <li key={`${currency}-${item._id}`} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                  <div className="min-w-0">
                                    <p className="text-white/80 capitalize">{String(item.source).replaceAll('-', ' ')}{item.relatedId ? <span className="text-white/35"> · {item.relatedId}</span> : ''}</p>
                                    <time className="text-white/35" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                                  </div>
                                  <div className="text-right shrink-0"><p className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>{item.amount > 0 ? '+' : ''}{item.amount} {unit}</p><p className="text-white/35">Balance {item.balanceAfter}</p></div>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-xs text-white/35 mt-3">No {unit} transactions have been recorded in the new ledger yet.</p>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* BOTTOM SECTION: AI Boss Arena Records */}
              <div 
                className="rounded-2xl p-6 shadow-xl relative"
                style={{
                  background: "rgba(8, 8, 12, 0.85)",
                  border: `1px solid ${currentTheme.accent}25`,
                  backdropFilter: "blur(16px)",
                  boxShadow: `0 16px 45px rgba(0, 0, 0, 0.6)`
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                  <div>
                    <h3 className="font-techno text-base font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>
                      AI BOSS ARENA BATTLE RECORDS
                    </h3>
                    <p className="text-white/40 text-2xs font-mono mt-0.5">Persistent database record of AI compiler showdowns</p>
                  </div>
                  
                  {/* General win-ratio tag */}
                  <div className="flex items-center gap-3 text-2xs font-mono bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                    <span className="text-white/50">TOTAL RATIO</span>
                    <span className="font-bold text-white">{activeTotalWins} W / {activeTotalLosses} L</span>
                    <span className="font-bold px-2 py-0.5 rounded" style={{ background: activeWinRate >= 50 ? "#10b981" : "#ef4444", color: 'white' }}>
                      {activeWinRate}% WIN RATIO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {BOT_CONFIGS.map((bot, idx) => {
                    const wins = activeWinsVsBots[idx] || 0;
                    const losses = activeLossesVsBots[idx] || 0;
                    const totalMatches = wins + losses;
                    const ratio = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
                    const isDefeated = wins > 0;

                    return (
                      <div 
                        key={bot.name}
                        className="rounded-xl p-4 flex flex-col justify-between border relative overflow-hidden backdrop-blur-md group hover:scale-102 transition-transform duration-300"
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          borderColor: `${bot.color}25`,
                        }}
                      >
                        {/* Glow halo under avatar */}
                        <div 
                          className="absolute -top-12 -left-12 w-28 h-28 rounded-full opacity-10 filter blur-xl"
                          style={{ backgroundColor: bot.color }}
                        />

                        {/* Top identity metadata */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="relative">
                            {/* Avatar border color matching bot color */}
                            <div 
                              className="w-16 h-16 rounded-full overflow-hidden border-2 bg-black/50"
                              style={{ borderColor: bot.color }}
                            >
                              <img 
                                src={bot.image} 
                                alt={bot.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2'%3E%3Cpath d='M22 12h-4l-3 9L9 3l-3 9H2'%3E%3C/path%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                            {/* Difficulty tier tag */}
                            <span 
                              className="absolute -bottom-1 -right-1 text-4xs font-mono font-black px-1.5 py-0.5 rounded border"
                              style={{ 
                                backgroundColor: '#06020d', 
                                borderColor: bot.color, 
                                color: bot.color 
                              }}
                            >
                              {bot.difficulty}
                            </span>
                          </div>

                          <p className="mt-3 font-techno font-bold text-xs text-white text-center tracking-wide uppercase truncate w-full">
                            {bot.name}
                          </p>
                          <p className="text-4xs font-mono text-white/30 text-center tracking-wide uppercase italic">
                            {bot.desc}
                          </p>
                        </div>

                        {/* Win Loss Telemetry breakdown */}
                        <div className="mt-4 pt-3 border-t border-white/5 space-y-2 relative z-10 font-mono text-3xs">
                          <div className="flex justify-between text-white/60">
                            <span>W/L LOG:</span>
                            <span className="font-bold text-white">{wins}W / {losses}L</span>
                          </div>
                          
                          {/* Win Ratio percentage bar */}
                          <div className="w-full h-1.5 rounded-full bg-white/5 border border-white/10 p-0.25">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${totalMatches > 0 ? ratio : 0}%`,
                                backgroundColor: bot.color 
                              }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-white/40">
                            <span>WIN RATIO:</span>
                            <span className="font-bold" style={{ color: bot.color }}>{ratio}%</span>
                          </div>
                        </div>

                        {/* Defeat status trophies */}
                        <div className="mt-4 relative z-10 text-center">
                          {isDefeated ? (
                            <span 
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-4xs font-mono font-bold tracking-wider uppercase bg-green-950/20 border border-green-500/30 text-green-400"
                              style={{ filter: "drop-shadow(0 0 3px rgba(16,185,129,0.2))" }}
                            >
                              <Trophy className="w-3 h-3 text-yellow-400" />
                              CONQUERED
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-4xs font-mono font-bold tracking-wider uppercase bg-red-950/20 border border-red-500/30 text-red-400"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              UNCONQUERED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div style={{ background: "linear-gradient(to bottom, rgba(4,0,18,1) 0%, rgba(0,0,4,1) 100%)" }}>
        <Footer theme={currentTheme} />
      </div>
    </div>
  );
};

export default ProfilePage;
