import React, { useState, useMemo } from 'react';
import { FileItem } from '../types';
import { MOCK_FILES } from '../data/mocks';
import Icon from '../components/Icon';
import Button from '../components/Button';

const ExplorerView = () => {
    const [path, setPath] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);

    const currentFolder = useMemo(() => {
        let folder = MOCK_FILES;
        for (const p of path) {
            const found = folder.find((f) => f.name === p && f.type === 'folder');
            if (found && found.children) folder = found.children;
        }
        return folder;
    }, [path]);

    const selectedFile = useMemo(() => {
        if (!selected) return null;
        const findFile = (items: FileItem[]): FileItem | undefined => {
            for (const item of items) {
                if (item.id === selected) return item;
                if (item.children) {
                    const found = findFile(item.children);
                    if (found) return found;
                }
            }
        };
        return findFile(MOCK_FILES);
    }, [selected]);

    return (
        <div className="flex h-full animate-in fade-in duration-300">
            <div className="w-80 border-r border-white/5 bg-zinc-900/30 p-4 flex flex-col">
                <div className="mb-4 p-2 bg-zinc-950 rounded border border-zinc-800 flex items-center text-xs font-mono text-zinc-400 overflow-hidden">
                    <Icon name="home" size="text-xs" className="mr-2 text-indigo-500" />
                    <button onClick={() => setPath([])} className="hover:text-white transition-colors">
                        root
                    </button>
                    {path.map((p, i) => (
                        <React.Fragment key={i}>
                            <span className="mx-1 text-zinc-600">/</span>
                            <span className="truncate">{p}</span>
                        </React.Fragment>
                    ))}
                </div>
                <div className="space-y-1">
                    {path.length > 0 && (
                        <button
                            onClick={() => setPath((prev) => prev.slice(0, -1))}
                            className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 rounded flex items-center gap-2"
                        >
                            <Icon name="arrow_upward" size="text-xs" /> Up Level
                        </button>
                    )}
                    {currentFolder.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => (f.type === 'folder' ? setPath([...path, f.name]) : setSelected(f.id))}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-3 transition-all group ${selected === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <Icon
                                name={
                                    f.type === 'folder'
                                        ? 'folder'
                                        : f.type === 'image'
                                          ? 'image'
                                          : f.type === 'model'
                                            ? 'extension'
                                            : f.type === 'video'
                                              ? 'movie'
                                              : 'description'
                                }
                                className={
                                    selected === f.id
                                        ? 'text-white'
                                        : f.type === 'folder'
                                          ? 'text-amber-400/80'
                                          : 'text-indigo-400/80'
                                }
                            />
                            <span className="truncate flex-1">{f.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
                {selectedFile ? (
                    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                            <Icon name="description" className="text-4xl text-zinc-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1 truncate">{selectedFile.name}</h2>
                        <div className="flex justify-center gap-4 text-xs text-zinc-500 mb-8 font-mono">
                            <span>{selectedFile.type.toUpperCase()}</span>
                            <span>{selectedFile.size || 'N/A'}</span>
                            <span>{selectedFile.date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="primary" icon="download">
                                Load
                            </Button>
                            <Button variant="secondary" icon="edit">
                                Edit
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-20">
                        <Icon name="grid_view" className="text-8xl mb-4" />
                        <p className="font-mono">NO SELECTION</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorerView;
