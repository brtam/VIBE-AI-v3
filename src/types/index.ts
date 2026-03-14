export type ViewMode = 'dashboard' | 'explorer' | 'workflows' | 'agent' | 'blender' | 'settings';

export interface SystemTelemetry {
    vramUsage: number;
    vramTotal: number;
    gpuTemp: number;
    ramUsage: number;
    ramTotal: number;
    activeServices: string[];
    logs: LogEntry[];
    isSimulated: boolean;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'warn' | 'error' | 'net';
}

export interface AgentMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: string;
    snapshot?: {
        vram: string;
        temp: string;
    };
}

export interface Preset {
    id: string;
    label: string;
    command: string;
}

export interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'code' | 'image' | 'model' | 'video';
    size?: string;
    date: string;
    children?: FileItem[];
}

export interface Workflow {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progress: number;
    category: 'template' | 'utility';
    specs: {
        vram: string;
        models: string[];
        tools: string[];
    };
}
