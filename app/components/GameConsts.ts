export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const CONSTANTS = {
    PLAYER_SPEED: 250,
    INTERACTION_DISTANCE: 70,
    HAZARD_ZONE_MARGIN: 40,
};

export const SCORES = {
    INTERVENE_YELLOW: 100,
    INTERVENE_ORANGE: 60,
    INTERVENE_RED: 30,
    ACCIDENT: -300,
};

// Colors
export const COLORS = {
    WATER: "#87CEEB",
    DECK: "#DEB887",
    RAILS: "#8B4513",
    PLAYER: "#2196F3",
    NPC_SAFE: "#4CAF50",
    // NPC Types
    NPC_PHOTO: "#E040FB", // Pink/Purple
    NPC_CURIOUS: "#FF9800", // Orange
    NPC_FAMILY: "#00BCD4", // Cyan
    NPC_TRENDY: "#E0E0E0", // White/Trendy
    NPC_PARTY: "#E91E63", // Red/Pink
    NPC_VIP: "#FFD700", // Gold
    // State colors
    YELLOW: "#FFD54F",
    ORANGE: "#FF9800",
    RED: "#F44336",
    BLACK: "#000000"
};

// Enums
export type HazardState = "SAFE" | "YELLOW" | "ORANGE" | "RED" | "ACCIDENT";
export type NPCType = "PHOTO_JUNKIE" | "CURIOUS" | "FAMILY" | "TRENDY" | "PARTY_GUEST" | "VIP";
export type BehaviorType = "SELFIE_RAIL" | "LEANING_RAIL" | "TAKE_OFF_LIFEJACKET" | "KIDS_RUNNING" | "DRINKING_NEAR_EDGE";

export const NPC_EMOJIS: Record<NPCType, string> = {
    "PHOTO_JUNKIE": "🤳",
    "CURIOUS": "🧐",
    "FAMILY": "👨‍👩‍👧",
    "TRENDY": "😎",
    "PARTY_GUEST": "🥴",
    "VIP": "🎩"
};

export interface DialogOption {
    text: string;
    isCorrect: boolean;
    isBonus?: boolean;
}

export interface DialogData {
    actionName: string;
    excuse: string;
    options: DialogOption[];
}

export interface LevelConfig {
    level: number;
    name: string;
    npcCount: number;
    durationSeconds: number;
    hazardSpawnRateMultiplier: number;
    allowedAccidents: number;
    rockingModifier?: number; // 0 = none, 1 = moderate, 2 = severe
    isNight?: boolean;        // Enables global illumination mask (Darkness)
    isParty?: boolean;        // High lighting/Firework effect for final level
}

export interface Obstacle {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: "BAR" | "CHAIRS" | "EQUIPMENT";
}

// Define some static obstacles on the deck
export const OBSTACLES: Obstacle[] = [
    { id: "bar_1", x: 350, y: 150, w: 100, h: 40, type: "BAR" },
    { id: "chairs_1", x: 200, y: 400, w: 60, h: 60, type: "CHAIRS" },
    { id: "chairs_2", x: 550, y: 350, w: 60, h: 60, type: "CHAIRS" },
    { id: "equipment", x: CANVAS_WIDTH / 2 - 40, y: CANVAS_HEIGHT - 120, w: 80, h: 50, type: "EQUIPMENT" }
];

export const LEVELS: LevelConfig[] = [
    {
        level: 1,
        name: "Ngày Đầu Làm Việc",
        npcCount: 4,
        durationSeconds: 60,
        hazardSpawnRateMultiplier: 0.8,
        allowedAccidents: 3,
    },
    {
        level: 2,
        name: "Cuối Tuần Đông Khách",
        npcCount: 8,
        durationSeconds: 90,
        hazardSpawnRateMultiplier: 1.2,
        allowedAccidents: 3,
    },
    {
        level: 3,
        name: "Nhóm Du Lịch & VIP",
        npcCount: 15,
        durationSeconds: 120,
        hazardSpawnRateMultiplier: 1.5,
        allowedAccidents: 2,
    },
    {
        level: 4,
        name: "Biển Động",
        npcCount: 20,
        durationSeconds: 90,
        hazardSpawnRateMultiplier: 2.0,
        allowedAccidents: 2,
        rockingModifier: 1,
    },
    {
        level: 5,
        name: "Siêu Bão",
        npcCount: 25,
        durationSeconds: 120,
        hazardSpawnRateMultiplier: 2.5,
        allowedAccidents: 1,
        rockingModifier: 2,
    },
    {
        level: 6,
        name: "Đêm Tối Trên Biển",
        npcCount: 20,
        durationSeconds: 120,
        hazardSpawnRateMultiplier: 2.0,
        allowedAccidents: 3,
        isNight: true,
    },
    {
        level: 7,
        name: "Bão Đêm Đoạt Mạng",
        npcCount: 28,
        durationSeconds: 150,
        hazardSpawnRateMultiplier: 2.8,
        allowedAccidents: 2,
        rockingModifier: 2,
        isNight: true,
    },
    {
        level: 8,
        name: "Giao Thừa (Boss Màn Cuối)",
        npcCount: 40,
        durationSeconds: 180,
        hazardSpawnRateMultiplier: 3.5,
        allowedAccidents: 1,
        isNight: true,
        isParty: true,
    },
];

interface BehaviorConfig {
    durationYellow: number;
    durationOrange: number;
    durationRed: number;
    requiresEdge: boolean;
    dialogs: DialogData[];
}

export const BEHAVIORS: Record<BehaviorType, BehaviorConfig> = {
    SELFIE_RAIL: {
        durationYellow: 3000,
        durationOrange: 2000,
        durationRed: 1000,
        requiresEdge: true,
        dialogs: [
            {
                actionName: "Chụp selfie sát lan can",
                excuse: "Góc view này mới đẹp! Tôi đang bắt trend tiktok!",
                options: [
                    { text: "Cẩn thận rớt điện thoại đó!", isCorrect: false },
                    { text: "Có luật không được trèo ra ngoài chị ơi!", isCorrect: true },
                    { text: "Để tôi chụp giúp chị góc đẹp mà an toàn hơn nhé!", isCorrect: true, isBonus: true }
                ]
            }
        ]
    },
    LEANING_RAIL: {
        durationYellow: 4000,
        durationOrange: 3000,
        durationRed: 1500,
        requiresEdge: true,
        dialogs: [
            {
                actionName: "Thò người ra ngoài lan can",
                excuse: "Tôi chỉ xem chân vịt quay thế nào thôi mà!",
                options: [
                    { text: "Đừng nhìn, chóng mặt đó!", isCorrect: false },
                    { text: "Khu vực này rất nguy hiểm nếu tàu lắc mạnh!", isCorrect: true },
                    { text: "Phía đằng kia có phòng kính xem an toàn hơn ạ!", isCorrect: true, isBonus: true }
                ]
            }
        ]
    },
    TAKE_OFF_LIFEJACKET: {
        durationYellow: 5000,
        durationOrange: 3000,
        durationRed: 2000,
        requiresEdge: false,
        dialogs: [
            {
                actionName: "Cởi áo phao",
                excuse: "Áo này xấu quá, chụp ảnh không đẹp gì cả!",
                options: [
                    { text: "Mặc áo phao vẫn ngầu mà!", isCorrect: false },
                    { text: "Quy định an toàn bắt buộc ạ!", isCorrect: true },
                    { text: "Cô giữ áo cẩn thận, lát vào trong phòng rồi cởi sau nhé!", isCorrect: true, isBonus: true }
                ]
            }
        ]
    },
    KIDS_RUNNING: {
        durationYellow: 4000,
        durationOrange: 3000,
        durationRed: 1000,
        requiresEdge: false,
        dialogs: [
            {
                actionName: "Để trẻ chạy nhảy",
                excuse: "Cháu nó đang tuổi hiếu động, bắt ngồi yên tội nghiệp!",
                options: [
                    { text: "Trẻ con rớt xuống biển là mệt lắm!", isCorrect: false },
                    { text: "Dưới khoang lái đang phát kẹo cho bé đó chị!", isCorrect: true, isBonus: true },
                    { text: "Sàn tàu trơn trượt rất dễ vấp ngã chị ạ.", isCorrect: true }
                ]
            }
        ]
    },
    DRINKING_NEAR_EDGE: {
        durationYellow: 6000,
        durationOrange: 4000,
        durationRed: 1000,
        requiresEdge: true,
        dialogs: [
            {
                actionName: "Say xỉn sát mạn tàu",
                excuse: "Tôi đaang vuuiii! Zô! Cậu uống không?",
                options: [
                    { text: "Tôi đang làm nhiệm vụ.", isCorrect: false },
                    { text: "Bên trong có ca nhạc hay lắm, anh vào xem đi!", isCorrect: true },
                    { text: "Anh say rồi, lùi lại đi!", isCorrect: false }
                ]
            },
            {
                actionName: "Uống rượu ở lan can",
                excuse: "Này, cậu biết tôi là ai không mà ra lệnh?",
                options: [
                    { text: "Dạ em là nhân viên an toàn.", isCorrect: false },
                    { text: "Dạ, cho em mời sếp quay lại phòng an toàn ạ.", isCorrect: true, isBonus: true },
                    { text: "Dù là ai cũng phải tuân thủ luật an toàn hàng hải ạ.", isCorrect: true }
                ]
            }
        ]
    }
};

export interface UpgradeConfig {
    id: "speed" | "whistle" | "radar";
    name: string;
    description: string;
    icon: string;
    maxLevel: number;
    costs: number[];
}

export const UPGRADE_STORE: UpgradeConfig[] = [
    {
        id: "speed",
        name: "Giày Thể Thao",
        description: "Tăng 20% tốc độ chạy mỗi cấp.",
        icon: "👟",
        maxLevel: 3,
        costs: [100, 250, 500] // Level 1 is 100, Level 2 is 250, Level 3 is 500
    },
    {
        id: "whistle",
        name: "Còi Khẩn Cấp",
        description: "Cấp 1: Thổi còi đứng hình NPC trong 2s. Cấp 2: Đứng hình 4s. (Có Cooldown)",
        icon: "哨", // Whistle emoji substitute since 哨 is Chinese char, better use 📯 or 哨
        maxLevel: 2,
        costs: [300, 600]
    },
    {
        id: "radar",
        name: "Bản Đồ Radar",
        description: "Phát hiện ngay những điểm nóng nguy hiểm, cực kỳ hữu dụng trong sương mù/đêm tối.",
        icon: "📡",
        maxLevel: 1,
        costs: [400]
    }
];
