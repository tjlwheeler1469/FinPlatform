import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NODE_COLORS = {
  client: "#D4A84C",
  portfolio: "#3B82F6",
  sector: "#10B981",
  asset: "#8B5CF6",
  liability: "#EF4444",
  entity: "#F59E0B",
  risk: "#DC2626",
  opportunity: "#059669",
};

const buildGraphData = (overview) => {
  if (!overview) return { nodes: [], links: [] };
  const nodes = [];
  const links = [];
  const nodeSet = new Set();

  const addNode = (id, label, type, val = 1) => {
    if (nodeSet.has(id)) return;
    nodeSet.add(id);
    nodes.push({ id, label, type, val });
  };

  // Clients
  const clients = overview?.clients || [
    { id: "c1", name: "Thompson Family", aum: 2278000 },
    { id: "c2", name: "Chen Holdings", aum: 5200000 },
    { id: "c3", name: "Mitchell Trust", aum: 1850000 },
    { id: "c4", name: "Parker SMSF", aum: 3100000 },
    { id: "c5", name: "Davis Super", aum: 890000 },
  ];

  const sectors = ["Equities", "Fixed Income", "Property", "Cash", "Alternatives"];
  const risks = ["Market Risk", "Concentration", "Liquidity"];
  const opps = ["Tax Harvest", "Rebalance", "Fee Reduction"];

  clients.forEach((c) => {
    addNode(c.id, c.name, "client", 3);
    const sectorSample = sectors.slice(0, 2 + Math.floor(Math.random() * 3));
    sectorSample.forEach((s) => {
      const sid = `sector_${s}`;
      addNode(sid, s, "sector", 2);
      links.push({ source: c.id, target: sid, label: "holds" });
    });
  });

  risks.forEach((r) => {
    const rid = `risk_${r}`;
    addNode(rid, r, "risk", 1.5);
    const affectedIdx = Math.floor(Math.random() * clients.length);
    links.push({ source: clients[affectedIdx].id, target: rid, label: "exposed" });
  });

  opps.forEach((o) => {
    const oid = `opp_${o}`;
    addNode(oid, o, "opportunity", 1.5);
    const idx = Math.floor(Math.random() * clients.length);
    links.push({ source: clients[idx].id, target: oid, label: "eligible" });
  });

  return { nodes, links };
};

const KnowledgeGraphPanel = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const graphRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/graph/overview`);
        const data = res.ok ? await res.json() : null;
        setGraphData(buildGraphData(data));
      } catch {
        setGraphData(buildGraphData(null));
      }
    };
    if (!collapsed) fetchData();
  }, [collapsed]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const fontSize = Math.max(10 / globalScale, 3);
    const r = Math.sqrt(node.val || 1) * 4;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = NODE_COLORS[node.type] || "#6B7280";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    if (globalScale > 0.8) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1a2744";
      ctx.fillText(node.label || "", node.x, node.y + r + fontSize);
    }
  }, []);

  const height = expanded ? 500 : 280;

  const legend = useMemo(
    () =>
      Object.entries(NODE_COLORS)
        .filter(([k]) => ["client", "sector", "risk", "opportunity"].includes(k))
        .map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {k}
          </span>
        )),
    []
  );

  return (
    <Card
      className="border-[#D4A84C]/20 bg-gradient-to-br from-[#1a2744]/[0.02] to-[#D4A84C]/[0.04]"
      data-testid="knowledge-graph-panel"
    >
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setCollapsed((p) => !p)}>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            Knowledge Graph Visualization
            <Badge className="bg-[#D4A84C] text-black text-[10px]">Interactive</Badge>
          </span>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-3">{legend}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((p) => !p)}
              data-testid="graph-expand-btn"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          <div
            ref={containerRef}
            className="rounded-lg border bg-white overflow-hidden"
            style={{ height }}
            data-testid="force-graph-container"
          >
            {graphData.nodes.length > 0 && (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeCanvasObject={nodeCanvasObject}
                linkColor={() => "#D4A84C33"}
                linkWidth={1}
                width={containerRef.current?.offsetWidth || 500}
                height={height}
                cooldownTicks={60}
                enableZoomInteraction={true}
                enablePanInteraction={true}
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default KnowledgeGraphPanel;
