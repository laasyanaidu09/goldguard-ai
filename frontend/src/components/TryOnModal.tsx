import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Upload, User, Sparkles, RefreshCw, Check, Undo, AlertTriangle } from "lucide-react";
import { type Asset } from "../services/api";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  jewellery: {
    category: string;
    purity: string;
    style: string;
    colour: string;
    image?: string | null;
  } | null;
  portfolio?: Asset[];
}

// Demo jewellery fallbacks when no image is uploaded
const DEMO_JEWELLERY_IMAGES = {
  necklace: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop",
  earrings: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=200&auto=format&fit=crop",
  bangle: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop",
  bracelet: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop",
  ring: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=200&auto=format&fit=crop",
  pendant: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop",
  other: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop"
};

// Retail Suggested Designs from real-world jewellers
const RETAIL_SUGGESTIONS = [
  {
    id: "sug_neck_1",
    name: "Joyalukkas Veda Antique Gold Haram",
    category: "necklace",
    purity: "22K",
    weight: "45.0g",
    brand: "Joyalukkas",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop",
    link: "https://www.joyalukkas.com"
  },
  {
    id: "sug_neck_2",
    name: "Malabar Antique Mango Necklace",
    category: "necklace",
    purity: "22K",
    weight: "32.4g",
    brand: "Malabar Gold",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop",
    link: "https://www.malabargoldanddiamonds.com"
  },
  {
    id: "sug_neck_3",
    name: "Tanishq Rivaah Bridal Gold Choker",
    category: "necklace",
    purity: "22K",
    weight: "58.2g",
    brand: "Tanishq",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop",
    link: "https://www.tanishq.co.in"
  },
  {
    id: "sug_ear_1",
    name: "Tanishq Rivaah Bridal Gold Jhumkas",
    category: "earrings",
    purity: "22K",
    weight: "16.8g",
    brand: "Tanishq",
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=200&auto=format&fit=crop",
    link: "https://www.tanishq.co.in"
  },
  {
    id: "sug_ear_2",
    name: "CaratLane 18K Yellow Studs",
    category: "earrings",
    purity: "18K",
    weight: "4.5g",
    brand: "CaratLane",
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=200&auto=format&fit=crop",
    link: "https://www.caratlane.com"
  },
  {
    id: "sug_ear_3",
    name: "Malabar Precia Gemstone Drops",
    category: "earrings",
    purity: "22K",
    weight: "12.2g",
    brand: "Malabar Gold",
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=200&auto=format&fit=crop",
    link: "https://www.malabargoldanddiamonds.com"
  },
  {
    id: "sug_brace_1",
    name: "Joyalukkas Gold Kada Bangle Pair",
    category: "bangle",
    purity: "22K",
    weight: "24.5g",
    brand: "Joyalukkas",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop",
    link: "https://www.joyalukkas.com"
  },
  {
    id: "sug_brace_2",
    name: "Joyalukkas Gold Kada Bangle Pair",
    category: "bracelet",
    purity: "22K",
    weight: "24.5g",
    brand: "Joyalukkas",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop",
    link: "https://www.joyalukkas.com"
  },
  {
    id: "sug_brace_3",
    name: "CaratLane 18K Diamond Flexi-Bracelet",
    category: "bracelet",
    purity: "18K",
    weight: "9.2g",
    brand: "CaratLane",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop",
    link: "https://www.caratlane.com"
  },
  {
    id: "sug_ring_1",
    name: "Malabar Viraaj Mens Gold Band",
    category: "ring",
    purity: "22K",
    weight: "8.4g",
    brand: "Malabar Gold",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=200&auto=format&fit=crop",
    link: "https://www.malabargoldanddiamonds.com"
  },
  {
    id: "sug_ring_2",
    name: "CaratLane 18K Floral Solitaire Ring",
    category: "ring",
    purity: "18K",
    weight: "3.2g",
    brand: "CaratLane",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=200&auto=format&fit=crop",
    link: "https://www.caratlane.com"
  }
];

export const TryOnModal: React.FC<TryOnModalProps> = ({ isOpen, onClose, jewellery, portfolio = [] }) => {
  // Wizard steps: 1 = Select Person, 2 = Select Jewellery, 3 = Preview, 4 = Result
  const [step, setStep] = useState<number>(1);
  
  // Person input states
  const [personOption, setPersonOption] = useState<"sample" | "upload" | "webcam">("sample");
  const [selectedModel, setSelectedModel] = useState<string>("model1");
  const [personUpload, setPersonUpload] = useState<string | null>(null);
  const [personCaptured, setPersonCaptured] = useState<string | null>(null);

  // Jewellery input states
  const [jewelleryOption, setJewelleryOption] = useState<"target" | "upload" | "collection" | "demo" | "suggested">("target");
  const [jewelleryUpload, setJewelleryUpload] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [selectedSuggestedId, setSelectedSuggestedId] = useState<string>("");
  
  // Sliders
  const [scale, setScale] = useState<number>(1.0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  // System states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blendMode, setBlendMode] = useState<"multiply" | "normal">("multiply");
  const [imageError, setImageError] = useState<boolean>(false);
  const [earringSpacing, setEarringSpacing] = useState<number>(140);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sample models
  const sampleModels = {
    model1: {
      name: "Neck & Ears Portrait (Necklace / Earrings)",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop"
    },
    model2: {
      name: "Hand & Wrist Close-up (Bracelet / Bangle / Ring)",
      url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop"
    },
    model3: {
      name: "Studio Face Portrait (General Fit)",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop"
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep(1);
      setImageError(false);
    } else {
      setImageError(false);
      if (jewellery?.image) {
        setJewelleryOption("target");
      } else {
        setJewelleryOption("demo");
      }
      
      // Auto-default the model template based on the jewelry category
      const cat = jewellery?.category?.toLowerCase() || "necklace";
      if (cat === "ring" || cat === "bangle" || cat === "bracelet") {
        setSelectedModel("model2");
      } else {
        setSelectedModel("model1");
      }
    }
  }, [isOpen, jewellery]);

  useEffect(() => {
    setImageError(false);
  }, [jewelleryOption, selectedAssetId, jewelleryUpload, jewellery]);

  if (!isOpen || !jewellery) return null;

  async function startCamera() {
    setCameraError(null);
    setPersonCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError("Webcam access denied or unavailable on this device.");
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror the captured image to match the mirrored live stream
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPersonCaptured(canvas.toDataURL("image/png"));
      }
    }
  };

  const handlePersonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPersonUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleJewelleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setJewelleryUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Get active person image source
  const getPersonImage = () => {
    if (personOption === "upload") return personUpload;
    if (personOption === "webcam") return personCaptured;
    return sampleModels[selectedModel as keyof typeof sampleModels]?.url;
  };

  // Get active jewellery image source
  const getJewelleryImage = () => {
    if (jewelleryOption === "target" && jewellery.image) return jewellery.image;
    if (jewelleryOption === "upload") return jewelleryUpload;
    if (jewelleryOption === "collection") {
      const asset = portfolio.find(a => a.asset_id === selectedAssetId);
      return asset?.image_reference || DEMO_JEWELLERY_IMAGES[jewellery.category.toLowerCase() as keyof typeof DEMO_JEWELLERY_IMAGES];
    }
    if (jewelleryOption === "suggested") {
      const match = RETAIL_SUGGESTIONS.find(s => s.id === selectedSuggestedId);
      return match ? match.image : DEMO_JEWELLERY_IMAGES[jewellery.category.toLowerCase() as keyof typeof DEMO_JEWELLERY_IMAGES];
    }
    return DEMO_JEWELLERY_IMAGES[jewellery.category.toLowerCase() as keyof typeof DEMO_JEWELLERY_IMAGES];
  };

  const getJewelleryName = () => {
    if (jewelleryOption === "target") return jewellery.style + " " + jewellery.category;
    if (jewelleryOption === "collection") {
      const asset = portfolio.find(a => a.asset_id === selectedAssetId);
      return asset ? asset.name : "Collection Piece";
    }
    if (jewelleryOption === "upload") return "Uploaded Design";
    if (jewelleryOption === "suggested") {
      const match = RETAIL_SUGGESTIONS.find(s => s.id === selectedSuggestedId);
      return match ? match.name : "Suggested Retail Design";
    }
    return "Demo " + jewellery.category;
  };

  const getStylistRecommendations = () => {
    const purity = jewellery.purity || "22K";
    
    let faceShape = "Oval";
    let skinTone = "Warm Gold";
    let ageGroup = "All ages (Classic elegance)";
    
    if (selectedModel === "model1") {
      faceShape = "Oval";
      skinTone = "Warm Golden Undertone";
      ageGroup = "Traditional Wedding / Festive Appropriate (20s - 40s)";
    } else if (selectedModel === "model2") {
      faceShape = "Heart / Round";
      skinTone = "Neutral Warm Undertone";
      ageGroup = "Contemporary / Semi-Formal Appropriate (20s - 30s)";
    } else if (selectedModel === "model3") {
      faceShape = "Oval / Square";
      skinTone = "Cool Rose Undertone";
      ageGroup = "Modern Minimalist Appropriate (25s - 50s)";
    } else {
      faceShape = "Symmetric (Oval-leaning)";
      skinTone = "Universal Skin Undertone";
      ageGroup = "Versatile styling matching your photo profile";
    }

    let stylisticFeedback = "";
    let retailBrand = "Joyalukkas";
    let retailLink = "https://www.joyalukkas.com/";
    let suggestedCollection = "Temple Jewellery / Haram series";
    
    if (purity.includes("22K")) {
      retailBrand = "Joyalukkas & Malabar Gold";
      retailLink = "https://www.joyalukkas.com/";
      suggestedCollection = "22K Traditional Gold Haram Collection";
      stylisticFeedback = `The rich 22K yellow gold perfectly accentuates the ${skinTone}. The traditional design suits formal events and complements the ${faceShape} face shape by adding structural elegance. Recommended as ${ageGroup}.`;
    } else if (purity.includes("18K")) {
      retailBrand = "CaratLane & BlueStone";
      retailLink = "https://www.caratlane.com/";
      suggestedCollection = "18K Contemporary Sparkle / Minimalist series";
      stylisticFeedback = `The refined 18K tone matches beautifully with a modern minimalist style. It offers a subtle sparkle ideal for daily wear, highlighting soft contours on a ${faceShape} face. Recommended as ${ageGroup}.`;
    } else {
      retailBrand = "Malabar Gold & Diamonds";
      retailLink = "https://www.malabargoldanddiamonds.com/";
      suggestedCollection = "24K Fine Gold Investment / Bullion collection";
      stylisticFeedback = `Pure 24K gold investment piece. Best suited for savings planning or heritage preservation. Recommended as ${ageGroup}.`;
    }

    return {
      faceShape,
      skinTone,
      ageGroup,
      stylisticFeedback,
      retailBrand,
      retailLink,
      suggestedCollection
    };
  };

  const handleGenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(4);
      // Reset sliders to defaults on fresh generation
      setScale(1.0);
      setOffsetY(0);
      setOffsetX(0);
      setRotation(0);
    }, 2200);
  };

  // Renders beautiful, vector gold graphics to ensure demo modes and fallback states look premium without broken images
  const renderJewelleryGraphic = (category: string, className = "w-full h-full") => {
    const cat = category.toLowerCase();
    if (cat === "necklace" || cat === "pendant") {
      return (
        <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gold Chain */}
          <path d="M 30,50 C 30,130 170,130 170,50" stroke="#d97706" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 45,58 C 45,120 155,120 155,58" stroke="#f59e0b" strokeWidth="3" fill="none" strokeDasharray="4,4" />
          {/* Pendant Connector */}
          <rect x="95" y="102" width="10" height="15" rx="2" fill="#b45309" stroke="#d97706" strokeWidth="2" />
          {/* Pendant Body */}
          <path d="M 100,115 L 85,140 L 100,165 L 115,140 Z" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          {/* Center Gem (Ruby) */}
          <path d="M 100,123 L 92,140 L 100,157 L 108,140 Z" fill="#dc2626" />
          {/* Gold droplets */}
          <circle cx="85" cy="140" r="3" fill="#fcd34d" />
          <circle cx="115" cy="140" r="3" fill="#fcd34d" />
          <circle cx="100" cy="168" r="4" fill="#fcd34d" />
        </svg>
      );
    }
    if (cat === "earrings") {
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stud */}
          <circle cx="50" cy="25" r="10" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          <circle cx="50" cy="25" r="5" fill="#dc2626" />
          {/* Connector link */}
          <line x1="50" y1="35" x2="50" y2="55" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
          {/* Drop Element */}
          <path d="M 40,55 L 50,85 L 60,55 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <circle cx="50" cy="65" r="4" fill="#ffffff" />
        </svg>
      );
    }
    if (cat === "ring") {
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gold Band */}
          <circle cx="50" cy="55" r="30" fill="none" stroke="#d97706" strokeWidth="7" />
          {/* Gem Setting */}
          <rect x="42" y="15" width="16" height="15" rx="2" fill="#b45309" />
          {/* Diamond */}
          <polygon points="50,5 38,20 62,20" fill="#eaf4fc" stroke="#cbd5e1" strokeWidth="1" />
          <polygon points="50,28 38,20 62,20" fill="#93c5fd" />
        </svg>
      );
    }
    // Bangle / Bracelet
    return (
      <svg className={className} viewBox="0 0 150 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Band */}
        <ellipse cx="75" cy="50" rx="60" ry="25" fill="none" stroke="#d97706" strokeWidth="8" />
        {/* Inner Details */}
        <ellipse cx="75" cy="50" rx="60" ry="25" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6,4" />
        {/* Gem Settings */}
        <circle cx="75" cy="25" r="6" fill="#dc2626" stroke="#b45309" strokeWidth="1" />
        <circle cx="35" cy="33" r="4" fill="#ffffff" stroke="#b45309" strokeWidth="1" />
        <circle cx="115" cy="33" r="4" fill="#ffffff" stroke="#b45309" strokeWidth="1" />
      </svg>
    );
  };

  // Renders the actual image overlays based on Category rules
  // Renders the actual image overlays based on Category rules
  const renderJewelleryOverlays = (isMirrored = false) => {
    const jImg = getJewelleryImage();
    const cat = jewellery.category.toLowerCase();
    const useFallbackSVG = !jImg || imageError || jewelleryOption === "demo";
    
    // Invert horizontal positioning offset to align with mirrored camera feed
    const effectiveOffsetX = isMirrored ? -offsetX : offsetX;

    if (cat === "earrings") {
      return (
        <>
          {/* Left Earring */}
          <div 
            className="absolute w-12 h-12 flex items-center justify-center pointer-events-none drop-shadow-md"
            style={{ 
              left: `calc(50% + ${effectiveOffsetX}px - ${earringSpacing / 2}px)`, 
              top: `calc(39% + ${offsetY}px)`,
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              mixBlendMode: blendMode,
              transition: "transform 0.1s ease-out, left 0.1s ease-out, top 0.1s ease-out"
            }}
          >
            {useFallbackSVG ? (
              renderJewelleryGraphic("earrings")
            ) : (
              <img 
                src={jImg} 
                alt="Left Earring" 
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          {/* Right Earring */}
          <div 
            className="absolute w-12 h-12 flex items-center justify-center pointer-events-none drop-shadow-md"
            style={{ 
              left: `calc(50% + ${effectiveOffsetX}px + ${earringSpacing / 2}px)`, 
              top: `calc(39% + ${offsetY}px)`,
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              mixBlendMode: blendMode,
              transition: "transform 0.1s ease-out, left 0.1s ease-out, top 0.1s ease-out"
            }}
          >
            {useFallbackSVG ? (
              renderJewelleryGraphic("earrings")
            ) : (
              <img 
                src={jImg} 
                alt="Right Earring" 
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </>
      );
    }

    if (cat === "necklace" || cat === "pendant") {
      return (
        <div 
          className="absolute w-36 h-36 flex items-center justify-center pointer-events-none drop-shadow-xl"
          style={{ 
            left: `calc(50% - 72px + ${effectiveOffsetX}px)`, 
            top: `calc(54% + ${offsetY}px)`,
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            mixBlendMode: blendMode,
            transition: "transform 0.1s ease-out, left 0.1s ease-out, top 0.1s ease-out"
          }}
        >
          {useFallbackSVG ? (
            renderJewelleryGraphic("necklace")
          ) : (
            <img 
              src={jImg} 
              alt="Necklace" 
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      );
    }

    if (cat === "ring") {
      return (
        <div 
          className="absolute w-12 h-12 flex items-center justify-center pointer-events-none drop-shadow-md"
          style={{ 
            left: `calc(50% - 24px + ${effectiveOffsetX}px)`, 
            top: `calc(70% + ${offsetY}px)`,
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            mixBlendMode: blendMode,
            transition: "transform 0.1s ease-out, left 0.1s ease-out, top 0.1s ease-out"
          }}
        >
          {useFallbackSVG ? (
            renderJewelleryGraphic("ring")
          ) : (
            <img 
              src={jImg} 
              alt="Ring" 
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      );
    }

    // Bangle or Bracelet
    return (
      <div 
        className="absolute w-20 h-20 flex items-center justify-center pointer-events-none drop-shadow-md"
        style={{ 
          left: `calc(50% - 40px + ${effectiveOffsetX}px)`, 
          top: `calc(75% + ${offsetY}px)`,
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          mixBlendMode: blendMode,
          transition: "transform 0.1s ease-out, left 0.1s ease-out, top 0.1s ease-out"
        }}
      >
        {useFallbackSVG ? (
          renderJewelleryGraphic("bangle")
        ) : (
          <img 
            src={jImg} 
            alt="Bracelet" 
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px] shadow-2xl">
        
        {/* LEFT VIEWPORT: Image Preview pane */}
        <div className="flex-1 bg-black relative flex flex-col justify-center items-center overflow-hidden border-r border-border min-h-[300px] md:min-h-0">
          <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded text-[10px] text-gold uppercase font-bold tracking-wider z-15 border border-gold/20 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Gemini Try-On Port
          </div>

          {step < 4 && !isProcessing && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-mutedText space-y-3">
              {step === 1 && (
                <>
                  <User className="h-12 w-12 text-gold opacity-40" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Step 1: Set Person Portrait</h3>
                    <p className="text-xs text-mutedText mt-1 max-w-xs">Use a model avatar, live webcam feed, or upload your own selfie.</p>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <Sparkles className="h-12 w-12 text-gold opacity-40" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Step 2: Select Gold Piece</h3>
                    <p className="text-xs text-mutedText mt-1 max-w-xs">Select target planning piece, upload a photo, or choose from your collection.</p>
                  </div>
                </>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex gap-4 items-center justify-center">
                    <div className="border border-border p-1 bg-card rounded-lg">
                      <img src={getPersonImage() || ""} alt="Person" className="w-16 h-16 object-cover rounded" />
                    </div>
                    <span className="text-white font-bold">+</span>
                    <div className="border border-border p-1 bg-card rounded-lg">
                      <img src={getJewelleryImage() || ""} alt="Jewellery" className="w-16 h-16 object-cover rounded" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white">Inputs Ready to Merge</h3>
                  <p className="text-xs text-mutedText max-w-xs">AI will align geometry and attachment vectors for realistic fitment.</p>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4 text-center z-10 p-6">
              <RefreshCw className="h-10 w-10 text-gold animate-spin mx-auto" />
              <div>
                <span className="text-gold font-bold text-sm block">Google Gemini Vision Engine</span>
                <span className="text-[11px] text-mutedText block mt-1">Merging person profile and gold design maps...</span>
              </div>
            </div>
          )}

          {step === 4 && !isProcessing && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Base Person Image or Live VR/AR Webcam feed */}
              {personOption === "webcam" && cameraStream ? (
                <video 
                  ref={(el) => {
                    if (el && cameraStream && el.srcObject !== cameraStream) {
                      el.srcObject = cameraStream;
                      el.play().catch(err => console.error("Error playing live VR feed:", err));
                    }
                  }}
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
              ) : (
                <img 
                  src={getPersonImage() || ""} 
                  alt="Try On Base" 
                  className="w-full h-full object-cover" 
                />
              )}
              {/* Overlay Jewellery Image */}
              {renderJewelleryOverlays(personOption === "webcam" && !!cameraStream)}
            </div>
          )}
        </div>

        {/* RIGHT CONTROL PANEL */}
        <div className="w-full md:w-[350px] p-6 bg-card flex flex-col justify-between overflow-y-auto">
          
          <div>
            <div className="flex justify-between items-start border-b border-border pb-3.5 mb-4">
              <div>
                <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">GoldGuard Simulator</span>
                <h3 className="text-base font-extrabold text-white">Virtual Try-On</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded hover:bg-cardHover text-mutedText hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* STEP 1: Select Person */}
            {step === 1 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText">Step 1 — Select Person Profile</span>
                
                <div className="flex bg-background p-0.5 rounded-lg border border-border">
                  <button 
                    onClick={() => { setPersonOption("sample"); stopCamera(); }}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold capitalize transition ${personOption === "sample" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Sample Model
                  </button>
                  <button 
                    onClick={() => { setPersonOption("upload"); stopCamera(); }}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold capitalize transition ${personOption === "upload" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Upload Photo
                  </button>
                  <button 
                    onClick={() => { setPersonOption("webcam"); startCamera(); }}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold capitalize transition ${personOption === "webcam" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Use Webcam
                  </button>
                </div>

                {personOption === "sample" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-mutedText uppercase">Choose Model Avatar</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold"
                    >
                      {Object.entries(sampleModels).map(([key, val]) => (
                        <option key={key} value={key}>{val.name}</option>
                      ))}
                    </select>
                    <div className="border border-border p-1 bg-black rounded-lg mt-2 flex justify-center">
                      <img src={sampleModels[selectedModel as keyof typeof sampleModels]?.url} className="w-full h-32 object-cover rounded-lg" alt="Model Preview" />
                    </div>
                  </div>
                )}

                {personOption === "upload" && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-mutedText uppercase block">Upload Portrait Photo</label>
                    <div className="border-2 border-dashed border-border p-4 rounded-xl text-center bg-background/40 hover:border-gold/40 transition">
                      <Upload className="h-6 w-6 text-gold mx-auto mb-2" />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handlePersonUpload}
                        className="text-[11px] text-mutedText file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-gold file:text-background file:font-semibold cursor-pointer"
                      />
                    </div>
                    {personUpload && (
                      <img src={personUpload} className="w-full h-32 object-contain rounded border border-border mt-2" alt="Uploaded Preview" />
                    )}
                  </div>
                )}

                {personOption === "webcam" && (
                  <div className="space-y-3">
                    {cameraError ? (
                      <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs rounded-lg">{cameraError}</div>
                    ) : (
                      <div className="space-y-2">
                        {!personCaptured ? (
                          <>
                            <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video relative">
                              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                              <canvas ref={canvasRef} className="hidden" />
                            </div>
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="w-full bg-gold text-background text-xs py-2 rounded-lg font-bold hover:bg-gold-light transition flex items-center justify-center gap-1.5"
                            >
                              <Camera className="h-4 w-4" /> Take Snapshot
                            </button>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <img src={personCaptured} className="w-full h-32 object-contain rounded border border-border" alt="Snapshot" />
                            <button 
                              onClick={() => { setPersonCaptured(null); startCamera(); }}
                              className="text-[10px] font-bold text-gold hover:text-white flex items-center gap-1"
                            >
                              <Undo className="h-3 w-3" /> Retake Snapshot
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Select Jewellery */}
            {step === 2 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText">Step 2 — Select Gold Jewellery</span>

                <div className="grid grid-cols-2 gap-1.5 bg-background p-0.5 rounded-lg border border-border">
                  <button 
                    onClick={() => setJewelleryOption("target")}
                    disabled={!jewellery.image}
                    className={`py-1.5 rounded text-[9px] font-bold transition disabled:opacity-30 ${jewelleryOption === "target" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Target Plan
                  </button>
                  <button 
                    onClick={() => setJewelleryOption("collection")}
                    disabled={portfolio.length === 0}
                    className={`py-1.5 rounded text-[9px] font-bold transition disabled:opacity-30 ${jewelleryOption === "collection" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    My Collection
                  </button>
                  <button 
                    onClick={() => setJewelleryOption("upload")}
                    className={`py-1.5 rounded text-[9px] font-bold transition col-span-1 ${jewelleryOption === "upload" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Upload Photo
                  </button>
                  <button 
                    onClick={() => setJewelleryOption("demo")}
                    className={`py-1.5 rounded text-[9px] font-bold transition col-span-1 ${jewelleryOption === "demo" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Demo Fallback
                  </button>
                  <button 
                    onClick={() => {
                      setJewelleryOption("suggested");
                      // Pre-select first matching suggested item
                      const matches = RETAIL_SUGGESTIONS.filter(s => s.category.toLowerCase() === jewellery.category.toLowerCase() || (jewellery.category.toLowerCase() === "bangle" && s.category === "bracelet") || (jewellery.category.toLowerCase() === "bracelet" && s.category === "bangle"));
                      if (matches.length > 0) {
                        setSelectedSuggestedId(matches[0].id);
                      } else {
                        setSelectedSuggestedId(RETAIL_SUGGESTIONS[0].id);
                      }
                    }}
                    className={`py-1.5 rounded text-[9px] font-bold transition col-span-2 ${jewelleryOption === "suggested" ? "bg-gold text-background" : "text-mutedText hover:text-white"}`}
                  >
                    Suggested Designs (from Retail Sites)
                  </button>
                </div>

                {jewelleryOption === "target" && jewellery.image && (
                  <div className="border border-border p-3 rounded-lg bg-background/50 space-y-2">
                    <span className="text-[10px] text-mutedText uppercase font-semibold">Active Planning Target</span>
                    <div className="flex gap-3 items-center">
                      <img src={jewellery.image} className="w-12 h-12 object-contain rounded border border-border/60 bg-white" alt="Target design" />
                      <div>
                        <span className="text-xs font-bold text-white block capitalize">{jewellery.style} {jewellery.category}</span>
                        <span className="text-[10px] text-gold uppercase font-extrabold">{jewellery.purity}</span>
                      </div>
                    </div>
                  </div>
                )}

                {jewelleryOption === "collection" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-mutedText uppercase block">Select Owned Asset</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold capitalize"
                    >
                      <option value="">-- Choose from portfolio --</option>
                      {portfolio.map(a => (
                        <option key={a.asset_id} value={a.asset_id}>{a.name} ({a.category})</option>
                      ))}
                    </select>
                    {selectedAssetId && (
                      <div className="border border-border p-3 rounded-lg bg-background/50 flex gap-3 items-center mt-2">
                        <img 
                          src={portfolio.find(a => a.asset_id === selectedAssetId)?.image_reference || DEMO_JEWELLERY_IMAGES[jewellery.category as keyof typeof DEMO_JEWELLERY_IMAGES]} 
                          className="w-12 h-12 object-contain bg-white rounded border" 
                          alt="Selected Asset" 
                        />
                        <div>
                          <span className="text-xs font-bold text-white block capitalize">
                            {portfolio.find(a => a.asset_id === selectedAssetId)?.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {jewelleryOption === "suggested" && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-mutedText uppercase block">Suggested Retail Designs ({jewellery.category})</label>
                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                      {RETAIL_SUGGESTIONS.filter(
                        s => s.category.toLowerCase() === jewellery.category.toLowerCase() || 
                             (jewellery.category.toLowerCase() === "bangle" && s.category === "bracelet") ||
                             (jewellery.category.toLowerCase() === "bracelet" && s.category === "bangle")
                      ).map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedSuggestedId(item.id)}
                          className={`p-2.5 rounded-lg border transition cursor-pointer flex gap-3 items-center justify-between ${selectedSuggestedId === item.id ? "bg-gold/10 border-gold" : "bg-background/40 border-border/60 hover:border-border"}`}
                        >
                          <div className="flex gap-2.5 items-center">
                            <img src={item.image} className="w-10 h-10 object-contain rounded bg-white border border-border/40" alt={item.name} />
                            <div>
                              <span className="text-[11px] font-bold text-white block leading-tight">{item.name}</span>
                              <div className="flex gap-2 items-center mt-1">
                                <span className="text-[8px] px-1 py-0.5 rounded bg-background font-mono text-mutedText font-semibold capitalize border border-border/40">{item.brand}</span>
                                <span className="text-[9px] text-gold font-bold">{item.weight} ({item.purity})</span>
                              </div>
                            </div>
                          </div>
                          
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md hover:bg-gold/10 text-gold hover:text-white transition flex items-center gap-1 text-[9px] font-bold border border-gold/30 hover:border-gold"
                          >
                            Visit Site
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {jewelleryOption === "upload" && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-mutedText uppercase block">Upload Jewellery File</label>
                    <div className="border-2 border-dashed border-border p-4 rounded-xl text-center bg-background/40 hover:border-gold/40 transition">
                      <Upload className="h-6 w-6 text-gold mx-auto mb-2" />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleJewelleryUpload}
                        className="text-[11px] text-mutedText file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-gold file:text-background file:font-semibold cursor-pointer"
                      />
                    </div>
                    {jewelleryUpload && (
                      <img src={jewelleryUpload} className="w-full h-32 object-contain rounded border border-border bg-white mt-2" alt="Uploaded Jewellery" />
                    )}
                  </div>
                )}

                {jewelleryOption === "demo" && (
                  <div className="border border-border p-3 rounded-lg bg-background/50 space-y-2">
                    <span className="text-[10px] text-mutedText uppercase font-semibold">Demo Gold Piece Fallback</span>
                    <div className="flex gap-3 items-center">
                      <img 
                        src={DEMO_JEWELLERY_IMAGES[jewellery.category.toLowerCase() as keyof typeof DEMO_JEWELLERY_IMAGES]} 
                        className="w-12 h-12 object-contain rounded border bg-white" 
                        alt="Demo Gold" 
                      />
                      <div>
                        <span className="text-xs font-bold text-white block capitalize">Premium Gold {jewellery.category}</span>
                        <span className="text-[10px] text-gold uppercase font-extrabold">{jewellery.purity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Preview Inputs */}
            {step === 3 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText">Step 3 — Preview Inputs</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border p-2 bg-background rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-mutedText block">Person Portrait</span>
                    <img src={getPersonImage() || ""} className="w-full h-24 object-cover rounded-lg" alt="Selected person" />
                  </div>
                  <div className="border border-border p-2 bg-background rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-mutedText block">Gold Jewellery</span>
                    <img src={getJewelleryImage() || ""} className="w-full h-24 object-contain bg-white rounded-lg" alt="Selected jewellery" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Generation Result */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="border-b border-border pb-3">
                  <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">Generated Target Result</span>
                  <h4 className="text-sm font-extrabold text-white capitalize">{getJewelleryName()}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-background/50 border border-border p-3 rounded-lg">
                  <div>
                    <span className="text-mutedText uppercase text-[9px] block">Purity</span>
                    <span className="text-white font-bold">{jewellery.purity}</span>
                  </div>
                  <div>
                    <span className="text-mutedText uppercase text-[9px] block">Category</span>
                    <span className="text-white font-bold capitalize">{jewellery.category}</span>
                  </div>
                  <div className="col-span-2 border-t border-border/40 pt-2 flex justify-between items-center mt-1">
                    <span className="text-mutedText uppercase text-[9px]">Try-On Confidence:</span>
                    <span className="text-emerald-400 font-extrabold uppercase text-[10px] flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {jewelleryOption === "target" ? "High" : "Medium"}
                    </span>
                  </div>
                </div>

                {/* Category & Model Suitability Check */}
                {((jewellery.category.toLowerCase() === "ring" || jewellery.category.toLowerCase() === "bangle" || jewellery.category.toLowerCase() === "bracelet") && selectedModel !== "model2" && personOption === "sample") && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[10px] text-amber-400 leading-normal flex gap-1.5 items-start mt-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-400" />
                    <span>
                      <strong>Layout Check:</strong> Face portraits do not show hands or wrists. We recommend clicking <strong>Try Another Model</strong> below and choosing <strong>Hand & Wrist Close-up</strong> (Model 2) to fit bracelets, bangles, or rings realistically.
                    </span>
                  </div>
                )}
                {((jewellery.category.toLowerCase() === "necklace" || jewellery.category.toLowerCase() === "earrings" || jewellery.category.toLowerCase() === "pendant") && selectedModel === "model2" && personOption === "sample") && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[10px] text-amber-400 leading-normal flex gap-1.5 items-start mt-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-400" />
                    <span>
                      <strong>Layout Check:</strong> Hand close-up shots do not show the face or neck. We recommend clicking <strong>Try Another Model</strong> below and choosing <strong>Neck & Ears Portrait</strong> (Model 1) to fit necklaces, pendants, or earrings.
                    </span>
                  </div>
                )}

                {/* Compositing blend settings */}
                <div className="flex gap-4 justify-between items-center text-xs">
                  <span className="text-mutedText">Background Blending:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setBlendMode("multiply")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${blendMode === "multiply" ? "bg-gold text-background" : "bg-background text-white border border-border"}`}
                    >
                      Multiply
                    </button>
                    <button 
                      onClick={() => setBlendMode("normal")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${blendMode === "normal" ? "bg-gold text-background" : "bg-background text-white border border-border"}`}
                    >
                      Normal
                    </button>
                  </div>
                </div>

                {/* Dynamic Category Sliders */}
                <div className="space-y-3.5 border-t border-border pt-4">
                  <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">Adjust Jewellery Fit</span>
                  
                  {/* Size slider (Common) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-mutedText">
                      <span>Size (Scale):</span>
                      <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="1.2" 
                      step="0.02"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full accent-gold bg-background h-1 rounded-full cursor-pointer"
                    />
                  </div>

                  {/* Vertical position (Common) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-mutedText">
                      <span>Vertical Position:</span>
                      <span>{offsetY}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-250" 
                      max="250" 
                      value={offsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      className="w-full accent-gold bg-background h-1 rounded-full cursor-pointer"
                    />
                  </div>

                  {/* Horizontal Position (Earrings / Rings / Bangles only) */}
                  {jewellery.category.toLowerCase() !== "necklace" && jewellery.category.toLowerCase() !== "pendant" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-mutedText">
                        <span>Horizontal Position:</span>
                        <span>{offsetX}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="-200" 
                        max="200" 
                        value={offsetX}
                        onChange={(e) => setOffsetX(Number(e.target.value))}
                        className="w-full accent-gold bg-background h-1 rounded-full cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Rotation (Earrings / Rings / Bangles only) */}
                  {jewellery.category.toLowerCase() !== "necklace" && jewellery.category.toLowerCase() !== "pendant" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-mutedText">
                        <span>Rotation Angle:</span>
                        <span>{rotation}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="-30" 
                        max="30" 
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full accent-gold bg-background h-1 rounded-full cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Earring Spacing (Earrings only) */}
                  {jewellery.category.toLowerCase() === "earrings" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-mutedText">
                        <span>Earring Spacing:</span>
                        <span>{earringSpacing}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="240" 
                        value={earringSpacing}
                        onChange={(e) => setEarringSpacing(Number(e.target.value))}
                        className="w-full accent-gold bg-background h-1 rounded-full cursor-pointer"
                      />
                      <span className="text-[9px] text-mutedText/75 block mt-0.5">
                        💡 Slide to 0px to merge into a single earring for side-profile portraits.
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Stylist Recommendations */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-gold font-bold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Stylist Recommendations</span>
                  </div>
                  <div className="bg-background/40 border border-gold/20 rounded-xl p-3.5 space-y-2 text-left">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-mutedText uppercase block text-[8px]">Face Shape Fit:</span>
                        <span className="text-white font-bold">{getStylistRecommendations().faceShape}</span>
                      </div>
                      <div>
                        <span className="text-mutedText uppercase block text-[8px]">Skin Undertone:</span>
                        <span className="text-white font-bold">{getStylistRecommendations().skinTone}</span>
                      </div>
                      <div className="col-span-2 border-t border-border/40 pt-1.5">
                        <span className="text-mutedText uppercase block text-[8px]">Age Appropriateness:</span>
                        <span className="text-white font-bold">{getStylistRecommendations().ageGroup}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-mutedText border-t border-border/40 pt-1.5 leading-normal">
                      {getStylistRecommendations().stylisticFeedback}
                    </p>
                  </div>

                  <div className="bg-gold/5 border border-gold/30 rounded-xl p-3.5 space-y-2 text-left">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gold-light uppercase tracking-wide">
                      <span>Retail Purchase Option</span>
                      <span className="text-[8px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-mono">{jewellery.purity}</span>
                    </div>
                    <p className="text-[10px] text-white leading-relaxed">
                      Available at <strong className="text-gold">{getStylistRecommendations().retailBrand}</strong> under the <strong className="text-gold">{getStylistRecommendations().suggestedCollection}</strong>.
                    </p>
                    <a 
                      href={getStylistRecommendations().retailLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1 bg-gold text-background py-2 rounded-lg font-bold hover:bg-gold-light transition text-[10px] mt-1 text-center"
                    >
                      Visit Official Website
                    </a>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ACTIONS: Step Navigation Footer */}
          <div className="space-y-2 mt-6">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={(!personUpload && personOption === "upload") || (!cameraStream && !personCaptured && personOption === "webcam")}
                className="w-full bg-gold text-background py-2.5 rounded-lg text-xs font-bold hover:bg-gold-light disabled:opacity-50 transition"
              >
                Next: Select Jewellery →
              </button>
            )}

            {step === 2 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-border text-white py-2.5 rounded-lg text-xs font-bold hover:bg-cardHover transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={(!jewelleryUpload && jewelleryOption === "upload") || (!selectedAssetId && jewelleryOption === "collection") || (!jewellery.image && jewelleryOption === "target") || (!selectedSuggestedId && jewelleryOption === "suggested")}
                  className="flex-1 bg-gold text-background py-2.5 rounded-lg text-xs font-bold hover:bg-gold-light disabled:opacity-50 transition"
                >
                  Next: Preview →
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-border text-white py-2.5 rounded-lg text-xs font-bold hover:bg-cardHover transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 bg-gold text-background py-2.5 rounded-lg text-xs font-bold hover:bg-gold-light transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Try-On
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2 text-xs">
                <button
                  onClick={handleGenerate}
                  className="w-full bg-gold text-background py-2.5 rounded-lg font-bold hover:bg-gold-light transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Simulation
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="border border-border text-white py-2 rounded-lg font-semibold hover:bg-cardHover transition text-center"
                  >
                    Try Another Model
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="border border-border text-white py-2 rounded-lg font-semibold hover:bg-cardHover transition text-center"
                  >
                    Try Another Piece
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full border border-gold/40 text-gold hover:text-white py-2.5 rounded-lg font-bold hover:bg-gold/10 transition mt-2"
                >
                  Back to Purchase Plan
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
