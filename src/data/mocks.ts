import { SystemTelemetry, FileItem, Workflow } from '../types';

export const INITIAL_SYSTEM_STATE: SystemTelemetry = {
    vramUsage: 3.2,
    vramTotal: 12,
    gpuTemp: 42.0,
    ramUsage: 8.4,
    ramTotal: 32,
    activeServices: ['Ollama Service', 'ComfyUI Backend'],
    logs: [
        { id: '1', timestamp: '10:00:01', message: 'VIBE System Core initialized', type: 'info' },
        { id: '2', timestamp: '10:00:02', message: 'Network listener active on port 3000', type: 'net' }
    ],
    isSimulated: true
};

export const MOCK_FILES: FileItem[] = [
    { id: 'root', name: 'root', type: 'folder', date: '-', children: [
        { id: 'models', name: 'models', type: 'folder', date: '2024-05-20', children: [
            { id: 'ckpt', name: 'checkpoints', type: 'folder', date: '2024-05-20', children: []},
            { id: 'llama3', name: 'llama-3-8b-instruct.gguf', type: 'model', size: '5.2GB', date: '2024-05-15' },
            { id: 'sdxl', name: 'sdxl_turbo_v1.0.safetensors', type: 'model', size: '6.9GB', date: '2024-05-10' },
        ]},
        { id: 'proj', name: 'projects', type: 'folder', date: '2024-02-10', children: [
            { id: 'py1', name: 'vibe_core.py', type: 'code', size: '12KB', date: 'Today 11:00' },
            { id: 'ts1', name: 'utils.ts', type: 'code', size: '4KB', date: 'Yesterday' }
        ]},
        { id: 'out', name: 'outputs', type: 'folder', date: '2024-05-21', children: [
            { id: 'img1', name: 'render_0042.png', type: 'image', size: '2.4MB', date: 'Today 10:23' },
            { id: 'vid1', name: 'scene_sequence_01.mp4', type: 'video', size: '45.2MB', date: 'Today 10:25' },
        ]},
    ]}
];

export const INITIAL_WORKFLOWS: Workflow[] = [
    // TEMPLATES
    {
        id: 'upscale',
        title: 'Image Upscaling',
        description: 'Real-ESRGAN 4x restoration pipeline for high-fidelity upscaling.',
        icon: 'photo_size_select_large',
        color: 'blue',
        status: 'idle',
        progress: 0,
        category: 'template',
        specs: { vram: '4.2 GB', models: ['RealESRGAN_x4plus'], tools: ['OpenCV', 'TileBuffer'] }
    },
    {
        id: 'video_edit',
        title: 'Smart Video Edit',
        description: 'Automated scene cut detection and flow-based interpolation.',
        icon: 'movie_edit',
        color: 'rose',
        status: 'idle',
        progress: 0,
        category: 'template',
        specs: { vram: '6.5 GB', models: ['RIFE-v4.6', 'PySceneDetect'], tools: ['FFmpeg'] }
    },
    {
        id: 'img2vid',
        title: 'Image to Video',
        description: 'Generate fluid motion sequences from static source images.',
        icon: 'motion_photos_auto',
        color: 'violet',
        status: 'idle',
        progress: 0,
        category: 'template',
        specs: { vram: '10.8 GB', models: ['SVD-XT-1.1', 'MotionCtrl'], tools: ['ComfyUI'] }
    },
    // UTILITIES
    {
        id: 'voice',
        title: 'TTS Synthesis',
        description: 'Generate speech using Coqui TTS.',
        icon: 'record_voice_over',
        color: 'purple',
        status: 'idle',
        progress: 0,
        category: 'utility',
        specs: { vram: '2.0 GB', models: ['XTTS-v2'], tools: ['TorchAudio'] }
    },
    {
        id: 'code',
        title: 'Code Audit',
        description: 'DeepSeek Coder security analysis.',
        icon: 'code',
        color: 'emerald',
        status: 'idle',
        progress: 0,
        category: 'utility',
        specs: { vram: '8.0 GB', models: ['DeepSeek-Coder-33B'], tools: ['LlamaCPP'] }
    },
    {
        id: 'train',
        title: 'LoRA Training',
        description: 'Fine-tune SDXL on local dataset.',
        icon: 'model_training',
        color: 'orange',
        status: 'idle',
        progress: 0,
        category: 'utility',
        specs: { vram: '12.0 GB', models: ['SDXL Base 1.0'], tools: ['Kohya_ss'] }
    }
];
