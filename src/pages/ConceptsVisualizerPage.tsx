import React, { useEffect, useState, useMemo, useRef, Suspense, lazy } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Use React.lazy for code splitting instead of next/dynamic (Vite compatible)
const ForceGraph2D = lazy(() =>
  import('react-force-graph').then(mod => ({ default: mod.ForceGraph2D }))
);

/**
 * ConceptsVisualizerPage
 * - Visualizes learning concepts as a force-directed graph.
 * - Allows searching, viewing, and updating progress on concepts.
 * - Integrates with Supabase for data and user progress.
 */
export default function ConceptsVisualizerPage() {
  // State for concepts and UI
  const [concepts, setConcepts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null);
  const [userProgress, setUserProgress] = useState<{ [conceptId: number]: number }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Loading and error states
  const [loadingConcepts, setLoadingConcepts] = useState(true);
  const [conceptsError, setConceptsError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Advanced graph features
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [hoveredLink, setHoveredLink] = useState<any | null>(null);

  // Ref for ForceGraph2D to control zoom/pan
  const fgRef = useRef<any>(null);

  // Fetch current user (replace with your auth logic if needed)
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    };
    getUser();
  }, []);

  // Fetch concepts from Supabase
  useEffect(() => {
    const fetchConcepts = async () => {
      setLoadingConcepts(true);
      setConceptsError(null);
      const { data, error } = await supabase
        .from('concepts')
        .select('*');
      if (error) {
        setConceptsError('Failed to fetch concepts.');
        toast.error('Failed to fetch concepts.');
        // Fallback to mock data if fetch fails
        setConcepts([
          {
            id: 1,
            name: 'Algebra',
            description: 'Basic algebraic concepts',
            progress: 0.8,
            links: [2, 3],
            difficulty: 'Easy',
            tags: ['math', 'foundation'],
            resources: ['https://www.khanacademy.org/math/algebra'],
          },
          {
            id: 2,
            name: 'Functions',
            description: 'Understanding functions',
            progress: 0.5,
            links: [3],
            difficulty: 'Medium',
            tags: ['math', 'functions'],
            resources: ['https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:functions'],
          },
          {
            id: 3,
            name: 'Graphs',
            description: 'Graphing equations',
            progress: 0.2,
            links: [],
            difficulty: 'Medium',
            tags: ['math', 'graphs'],
            resources: [],
          },
        ]);
      } else if (data) {
        setConcepts(
          data.map((c: any) => ({
            ...c,
            links: Array.isArray(c.links)
              ? c.links
              : typeof c.links === 'string'
              ? JSON.parse(c.links)
              : [],
            tags: Array.isArray(c.tags)
              ? c.tags
              : typeof c.tags === 'string'
              ? JSON.parse(c.tags)
              : [],
            resources: Array.isArray(c.resources)
              ? c.resources
              : typeof c.resources === 'string'
              ? JSON.parse(c.resources)
              : [],
          }))
        );
      }
      setLoadingConcepts(false);
    };
    fetchConcepts();
  }, []);

  // Fetch user progress for all concepts
  useEffect(() => {
    if (!userId) return;
    setLoadingProgress(true);
    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from('concept_progress')
        .select('concept_id, progress')
        .eq('user_id', userId);

      if (!error && data) {
        const progressMap: { [conceptId: number]: number } = {};
        data.forEach((row: any) => {
          progressMap[row.concept_id] = row.progress;
        });
        setUserProgress(progressMap);
      } else if (error) {
        toast.error('Failed to fetch user progress.');
      }
      setLoadingProgress(false);
    };
    fetchProgress();
  }, [userId]);

  // Filtered concepts based on search
  const filteredConcepts = useMemo(
    () =>
      concepts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [concepts, search]
  );

  // Build graph data for ForceGraph2D
  const graphData = useMemo(() => {
    const nodes = filteredConcepts.map(c => ({
      ...c,
      progress: userProgress[c.id] ?? c.progress ?? 0,
      highlighted: selectedConcept && (c.id === selectedConcept.id || selectedConcept.links?.includes(c.id)),
    }));
    const nodeIds = new Set(nodes.map(n => n.id));
    const links: { source: number; target: number }[] = [];
    nodes.forEach(n => {
      n.links.forEach((targetId: number) => {
        if (nodeIds.has(targetId)) {
          links.push({ source: n.id, target: targetId });
        }
      });
    });
    return { nodes, links };
  }, [filteredConcepts, userProgress, selectedConcept]);

  // Helper: Get related/prerequisite concepts for the selected concept
  const relatedConcepts = useMemo(() => {
    if (!selectedConcept) return [];
    return concepts.filter(c => selectedConcept.links?.includes(c.id));
  }, [selectedConcept, concepts]);

  // Handler: Mark concept as complete (progress = 1)
  const handleMarkComplete = async (conceptId: number) => {
    if (!userId) return;
    setUpdatingProgress(true);
    const { error } = await supabase
      .from('concept_progress')
      .upsert([{ user_id: userId, concept_id: conceptId, progress: 1 }], { onConflict: 'user_id,concept_id' });
    if (!error) {
      setUserProgress(prev => ({ ...prev, [conceptId]: 1 }));
      if (selectedConcept) setSelectedConcept({ ...selectedConcept, progress: 1 });
      toast.success('Marked as complete!');
    } else {
      toast.error('Failed to update progress.');
    }
    setUpdatingProgress(false);
  };

  // Handler: Update progress (for demo, increments by 0.2)
  const handleIncrementProgress = async (conceptId: number) => {
    if (!userId) return;
    setUpdatingProgress(true);
    const current = userProgress[conceptId] ?? 0;
    const newProgress = Math.min(1, current + 0.2);
    const { error } = await supabase
      .from('concept_progress')
      .upsert([{ user_id: userId, concept_id: conceptId, progress: newProgress }], { onConflict: 'user_id,concept_id' });
    if (!error) {
      setUserProgress(prev => ({ ...prev, [conceptId]: newProgress }));
      if (selectedConcept) setSelectedConcept({ ...selectedConcept, progress: newProgress });
      toast.success('Progress updated!');
    } else {
      toast.error('Failed to update progress.');
    }
    setUpdatingProgress(false);
  };

  // Handler: Reset zoom/pan
  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 40);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Concepts Visualizer</h1>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search concepts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border px-2 py-1 rounded mb-4 w-full max-w-md"
        aria-label="Search concepts"
      />

      {/* Reset Zoom Button */}
      <div className="mb-2">
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm"
          onClick={handleResetZoom}
        >
          Reset Zoom
        </button>
      </div>

      {/* Loading/Error States */}
      {loadingConcepts || loadingProgress ? (
        <div className="text-center text-gray-500 my-8">Loading...</div>
      ) : conceptsError ? (
        <div className="text-center text-red-600 my-8">{conceptsError}</div>
      ) : (
        <>
          {/* Graph Visualization */}
          <div className="relative my-6 border rounded p-2 bg-white" style={{ height: 400 }}>
            <Suspense fallback={<div className="text-center text-gray-500">Loading graph...</div>}>
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="id"
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                onNodeClick={node => setSelectedConcept(node)}
                onNodeHover={node => setHoveredNode(node)}
                onLinkHover={link => setHoveredLink(link)}
                enableNodeDrag={true}
                width={typeof window !== 'undefined' ? window.innerWidth - 64 : 800}
                height={400}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  // Highlight selected/related nodes
                  const isHighlighted = node.highlighted;
                  const isHovered = hoveredNode && hoveredNode.id === node.id;
                  const label = node.name;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.beginPath();
                  ctx.arc(node.x!, node.y!, isHighlighted ? 16 : 12, 0, 2 * Math.PI, false);
                  ctx.fillStyle = isHovered ? '#fef9c3' : isHighlighted ? '#e0f2fe' : '#fff';
                  ctx.fill();
                  ctx.lineWidth = isHighlighted ? 4 : 2;
                  ctx.strokeStyle = node.color || (isHighlighted ? '#0284c7' : '#1d4ed8');
                  ctx.stroke();
                  // Progress ring
                  if (typeof node.progress === 'number') {
                    ctx.beginPath();
                    ctx.arc(
                      node.x!,
                      node.y!,
                      isHighlighted ? 18 : 14,
                      -Math.PI / 2,
                      -Math.PI / 2 + 2 * Math.PI * node.progress,
                      false
                    );
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = isHighlighted ? 4 : 3;
                    ctx.stroke();
                  }
                  // Draw label
                  ctx.fillStyle = '#222';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(label, node.x!, node.y! + (isHighlighted ? 24 : 20));
                }}
                linkCanvasObjectMode={link =>
                  hoveredLink && hoveredLink.source === link.source && hoveredLink.target === link.target
                    ? 'after'
                    : undefined
                }
                linkCanvasObject={(link, ctx, globalScale) => {
                  // Tooltip for hovered link
                  if (
                    hoveredLink &&
                    hoveredLink.source === link.source &&
                    hoveredLink.target === link.target
                  ) {
                    const start = link.source as { x?: number; y?: number } | undefined;
                    const end = link.target as { x?: number; y?: number } | undefined;
                    if (start && end && typeof start.x === 'number' && typeof start.y === 'number' && typeof end.x === 'number' && typeof end.y === 'number') {
                      const midX = (start.x + end.x) / 2;
                      const midY = (start.y + end.y) / 2;
                      ctx.save();
                      ctx.font = `${14 / globalScale}px Sans-Serif`;
                      ctx.fillStyle = '#f59e42';
                      ctx.fillRect(midX - 40, midY - 18, 80, 24);
                      ctx.fillStyle = '#222';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText('Prerequisite', midX, midY - 6);
                      ctx.restore();
                    }
                  }
                }}
              />
            </Suspense>
            {/* Node Tooltip */}
            {hoveredNode && (
              <div
                style={{
                  position: 'absolute',
                  left: hoveredNode.x,
                  top: hoveredNode.y,
                  pointerEvents: 'none',
                  background: 'rgba(255,255,210,0.95)',
                  border: '1px solid #eab308',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 14,
                  color: '#222',
                  zIndex: 10,
                  transform: 'translate(-50%, -120%)',
                  minWidth: 120,
                  maxWidth: 220,
                  whiteSpace: 'normal',
                }}
              >
                <div className="font-bold">{hoveredNode.name}</div>
                <div className="text-xs">{hoveredNode.description}</div>
                {typeof hoveredNode.progress === 'number' && (
                  <div className="text-xs mt-1">
                    Progress: {(hoveredNode.progress * 100).toFixed(0)}%
                  </div>
                )}
                {hoveredNode.difficulty && (
                  <div className="text-xs">Difficulty: {hoveredNode.difficulty}</div>
                )}
              </div>
            )}
          </div>

          {/* List of Concepts (for demo/testing) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredConcepts.map(concept => {
              const progress = userProgress[concept.id] ?? concept.progress ?? 0;
              return (
                <div
                  key={concept.id}
                  className="border rounded p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedConcept({ ...concept, progress })}
                  tabIndex={0}
                  aria-label={`View details for ${concept.name}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedConcept({ ...concept, progress });
                  }}
                >
                  <div className="font-semibold">{concept.name}</div>
                  <div className="text-sm text-gray-600">{concept.description}</div>
                  <div className="mt-2">
                    {/* Progress indicator */}
                    <div className="w-full bg-gray-200 rounded h-2">
                      <div
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Progress: {(progress * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Concept Detail Modal/Sidebar */}
      {selectedConcept && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setSelectedConcept(null)}
              aria-label="Close details"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-2">{selectedConcept.name}</h2>
            <p className="mb-4">{selectedConcept.description}</p>
            <div className="mb-2">
              <strong>Progress:</strong> {(userProgress[selectedConcept.id] ?? selectedConcept.progress ?? 0) * 100}%
            </div>
            {/* Mark as complete / Increment progress */}
            <div className="flex gap-2 mb-2">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                onClick={() => handleMarkComplete(selectedConcept.id)}
                disabled={updatingProgress || (userProgress[selectedConcept.id] ?? selectedConcept.progress ?? 0) === 1}
              >
                {updatingProgress ? 'Saving...' : 'Mark Complete'}
              </button>
              <button
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm"
                onClick={() => handleIncrementProgress(selectedConcept.id)}
                disabled={updatingProgress || (userProgress[selectedConcept.id] ?? selectedConcept.progress ?? 0) >= 1}
              >
                {updatingProgress ? 'Saving...' : '+ Progress'}
              </button>
            </div>
            {/* Difficulty */}
            {selectedConcept.difficulty && (
              <div className="mb-2">
                <strong>Difficulty:</strong> {selectedConcept.difficulty}
              </div>
            )}
            {/* Tags */}
            {selectedConcept.tags && selectedConcept.tags.length > 0 && (
              <div className="mb-2">
                <strong>Tags:</strong>{' '}
                {selectedConcept.tags.map((tag: string, idx: number) => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Resources */}
            {selectedConcept.resources && selectedConcept.resources.length > 0 && (
              <div className="mb-2">
                <strong>Resources:</strong>
                <ul className="list-disc list-inside">
                  {selectedConcept.resources.map((url: string, idx: number) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Related/Prerequisite Concepts */}
            {relatedConcepts.length > 0 && (
              <div className="mt-4">
                <strong>Prerequisite/Related Concepts:</strong>
                <ul className="list-disc list-inside">
                  {relatedConcepts.map(concept => (
                    <li key={concept.id}>
                      <button
                        className="text-blue-700 underline"
                        onClick={() => setSelectedConcept({ ...concept, progress: userProgress[concept.id] ?? concept.progress ?? 0 })}
                      >
                        {concept.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}