"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockDependencyNodes, mockDependencyEdges } from "@/mock/data";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Layers, AlertTriangle, Info } from "lucide-react";

const layerColors: Record<string, string> = {
  presentation: "#22d3ee",
  business: "#a78bfa",
  data: "#34d399",
  infrastructure: "#fbbf24",
};
const typeShapes: Record<string, string> = {
  module: "roundrectangle",
  file: "rectangle",
  service: "ellipse",
  database: "diamond",
  api: "pentagon",
};

export default function DependenciesPage() {
  const cyRef = useRef<HTMLDivElement>(null);
  const [cyInstance, setCyInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import("cytoscape").then((cytoscapeModule) => {
      const cytoscape = cytoscapeModule.default;
      if (!mounted || !cyRef.current) return;

      const cy = cytoscape({
        container: cyRef.current,
        elements: [
          ...mockDependencyNodes.map((n) => ({
            data: { id: n.id, label: n.label, type: n.type, layer: n.layer, complexity: n.complexity, connections: n.connections },
          })),
          ...mockDependencyEdges.map((e, i) => ({
            data: { id: `e${i}`, source: e.source, target: e.target, type: e.type, weight: e.weight, isCyclic: e.isCyclic },
          })),
        ],
        style: [
          {
            selector: "node",
            style: {
              label: "data(label)",
              "text-valign": "center" as const,
              "text-halign": "center" as const,
              color: "#e4e4e7",
              "font-size": "10px",
              "font-family": "Inter, sans-serif",
              "background-opacity": 0.9,
              "border-width": 2,
              "border-opacity": 0.8,
              width: 50,
              height: 50,
              "text-wrap": "wrap" as const,
              "text-max-width": "80px",
            } as any,
          },
          ...Object.entries(layerColors).map(([layer, color]) => ({
            selector: `node[layer="${layer}"]`,
            style: { "background-color": color, "border-color": color } as any,
          })),
          {
            selector: "edge",
            style: {
              width: 1.5,
              "line-color": "#3f3f46",
              "target-arrow-color": "#3f3f46",
              "target-arrow-shape": "triangle" as const,
              "curve-style": "bezier" as const,
              opacity: 0.6,
            } as any,
          },
          {
            selector: "edge[?isCyclic]",
            style: { "line-color": "#f87171", "target-arrow-color": "#f87171", "line-style": "dashed" as const, width: 2 } as any,
          },
          {
            selector: "node:selected",
            style: { "border-width": 3, "border-color": "#22d3ee", "background-opacity": 1 } as any,
          },
        ],
        layout: { name: "cose", padding: 50, nodeRepulsion: () => 8000, idealEdgeLength: () => 120, animate: true, animationDuration: 1000 } as any,
      });

      cy.on("tap", "node", (evt: any) => {
        const node = evt.target.data();
        setSelectedNode(node);
      });
      cy.on("tap", (evt: any) => {
        if (evt.target === cy) setSelectedNode(null);
      });

      setCyInstance(cy);
    });
    return () => { mounted = false; };
  }, []);

  const handleZoomIn = () => cyInstance?.zoom(cyInstance.zoom() * 1.3);
  const handleZoomOut = () => cyInstance?.zoom(cyInstance.zoom() * 0.7);
  const handleReset = () => cyInstance?.fit(undefined, 50);

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Dependency Graph" description="Interactive architecture visualization of your codebase" />

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Graph */}
          <FloatingGlowPanel className="lg:col-span-3 relative" delay={0}>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {[
                { icon: ZoomIn, action: handleZoomIn },
                { icon: ZoomOut, action: handleZoomOut },
                { icon: RotateCcw, action: handleReset },
                { icon: Maximize2, action: handleReset },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} className="p-2 rounded-lg bg-black/60 border border-white/10 text-muted-foreground hover:text-foreground transition-colors">
                  <btn.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div ref={cyRef} className="w-full h-[500px] rounded-2xl" />
          </FloatingGlowPanel>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Legend */}
            <FloatingGlowPanel className="p-4" delay={0.1}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400" />Legend</h3>
              <div className="space-y-2">
                {Object.entries(layerColors).map(([layer, color]) => (
                  <div key={layer} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="capitalize">{layer}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-6 h-0.5 bg-zinc-500" /><span>Normal</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-red-400" /><span>Cyclic</span>
                </div>
              </div>
            </FloatingGlowPanel>

            {/* Selected node */}
            <FloatingGlowPanel className="p-4" delay={0.15}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-cyan-400" />Node Details</h3>
              {selectedNode ? (
                <div className="space-y-2 text-xs">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedNode.label}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{selectedNode.type}</span></div>
                  <div><span className="text-muted-foreground">Layer:</span> <span className="capitalize">{selectedNode.layer}</span></div>
                  <div><span className="text-muted-foreground">Complexity:</span> <span>{selectedNode.complexity}</span></div>
                  <div><span className="text-muted-foreground">Connections:</span> <span>{selectedNode.connections}</span></div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Click a node to see details</p>
              )}
            </FloatingGlowPanel>

            {/* Stats */}
            <FloatingGlowPanel className="p-4" delay={0.2}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Graph Stats</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Nodes</span><span>{mockDependencyNodes.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Edges</span><span>{mockDependencyEdges.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cyclic Deps</span><span className="text-red-400">{mockDependencyEdges.filter(e => e.isCyclic).length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max Connections</span><span>{Math.max(...mockDependencyNodes.map(n => n.connections))}</span></div>
              </div>
            </FloatingGlowPanel>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
