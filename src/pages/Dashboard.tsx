import { useState, useMemo, useCallback } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TrafficSimulator from "@/components/dashboard/TrafficSimulator";
import RouteFinder from "@/components/dashboard/RouteFinder";
import SystemDashboard from "@/components/dashboard/SystemDashboard";
import TrafficMapCanvas from "@/components/dashboard/TrafficMapCanvas";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useTrafficSimulation } from "@/hooks/useTrafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Network, 
  Route, 
  TreeDeciduous, 
  Navigation,
  Hammer,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  Upload,
  GraduationCap,
  Sparkles
} from "lucide-react";
import type { Edge } from "@/utils/kruskal";
import GraphBuilder from "@/components/GraphBuilder";
import GraphTemplates from "@/components/GraphTemplates";
import GraphVisualization from "@/components/GraphVisualization";
import DijkstraVisualization from "@/components/DijkstraVisualization";
import PrimVisualization from "@/components/PrimVisualization";
import GraphImport from "@/components/GraphImport";
import EducationalMode from "@/components/EducationalMode";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import type { MapType } from "@/components/maps/PakistanMapSVG";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

const DEFAULT_INITIAL_NODES: Node[] = [
  { id: "KHI", x: 680, y: 420, label: "Karachi" },
  { id: "LHR", x: 480, y: 200, label: "Lahore" },
  { id: "ISB", x: 420, y: 120, label: "Islamabad" },
  { id: "RWP", x: 430, y: 110, label: "Rawalpindi" },
  { id: "FSD", x: 400, y: 220, label: "Faisalabad" },
  { id: "MUL", x: 350, y: 300, label: "Multan" },
  { id: "PSH", x: 300, y: 80, label: "Peshawar" },
  { id: "QTA", x: 180, y: 280, label: "Quetta" },
  { id: "HYD", x: 600, y: 380, label: "Hyderabad" },
  { id: "SKT", x: 460, y: 170, label: "Sialkot" },
  { id: "GUJ", x: 440, y: 180, label: "Gujranwala" },
  { id: "BWP", x: 320, y: 340, label: "Bahawalpur" },
  { id: "SGD", x: 380, y: 210, label: "Sargodha" },
  { id: "SKR", x: 530, y: 320, label: "Sukkur" },
];

const DEFAULT_INITIAL_EDGES: Edge[] = [
  { from: "KHI", to: "HYD", weight: 165, traffic: "high", isBlocked: false },
  { from: "KHI", to: "SKR", weight: 450, traffic: "medium", isBlocked: false },
  { from: "LHR", to: "ISB", weight: 380, traffic: "high", isBlocked: false },
  { from: "LHR", to: "FSD", weight: 130, traffic: "high", isBlocked: false },
  { from: "LHR", to: "MUL", weight: 350, traffic: "medium", isBlocked: false },
  { from: "ISB", to: "RWP", weight: 15, traffic: "high", isBlocked: false },
  { from: "ISB", to: "PSH", weight: 180, traffic: "high", isBlocked: false },
  { from: "FSD", to: "MUL", weight: 240, traffic: "medium", isBlocked: false },
  { from: "FSD", to: "SKT", weight: 220, traffic: "medium", isBlocked: false },
  { from: "MUL", to: "BWP", weight: 90, traffic: "low", isBlocked: false },
  { from: "QTA", to: "MUL", weight: 600, traffic: "low", isBlocked: false },
  { from: "QTA", to: "KHI", weight: 700, traffic: "medium", isBlocked: false },
  { from: "HYD", to: "SKR", weight: 300, traffic: "medium", isBlocked: false },
  { from: "SKT", to: "GUJ", weight: 50, traffic: "medium", isBlocked: false },
  { from: "GUJ", to: "LHR", weight: 70, traffic: "high", isBlocked: false },
  { from: "SKR", to: "MUL", weight: 400, traffic: "medium", isBlocked: false },
  { from: "SGD", to: "FSD", weight: 110, traffic: "medium", isBlocked: false },
  { from: "SGD", to: "LHR", weight: 190, traffic: "medium", isBlocked: false },
];

const Dashboard = () => {
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(DEFAULT_INITIAL_EDGES);
  const [activeTab, setActiveTab] = useState("map");
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [mstEdges, setMstEdges] = useState<Edge[]>([]);
  const [currentMapType, setCurrentMapType] = useState<MapType>('pakistan');
  const [algorithmStatus, setAlgorithmStatus] = useState<{
    name: string;
    step: string;
    progress: number;
    details?: string[];
  } | null>(null);
  
  // Sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Tutorial state
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const handleEdgesUpdate = useCallback((updatedEdges: Edge[]) => {
    setEdges(updatedEdges);
  }, []);

  const {
    isSimulating,
    isPaused,
    speed,
    trafficMultipliers,
    startSimulation,
    stopSimulation,
    togglePause,
    setSpeed,
    simulateAccident,
    setTrafficLevel,
    clearAccidents,
  } = useTrafficSimulation({
    edges,
    onEdgesUpdate: handleEdgesUpdate,
  });

  // Calculate network health
  const networkHealth = useMemo(() => {
    if (edges.length === 0) return "optimal";
    const congestedCount = edges.filter(e => {
      const multiplier = trafficMultipliers[`${e.from}-${e.to}`] || 1;
      return multiplier > 1.5 || e.traffic === 'high';
    }).length;
    const ratio = congestedCount / edges.length;
    if (ratio > 0.5) return "congested";
    if (ratio > 0.2) return "strained";
    return "optimal";
  }, [edges, trafficMultipliers]);

  const handleToggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  const handleRouteCalculated = (path: string[]) => {
    setHighlightedPath(path);
    setAlgorithmStatus({
      name: "Dijkstra's Algorithm",
      step: "Route found!",
      progress: 100,
      details: [`Path: ${path.join(" → ")}`, `Stops: ${path.length}`]
    });
  };

  return (
    <div className="min-h-screen bg-background city-grid-bg flex flex-col">
      {/* Header */}
      <DashboardHeader 
        isSimulating={isSimulating} 
        networkHealth={networkHealth}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Controls */}
        <aside 
          className={`
            hidden md:block
            ${leftSidebarOpen ? 'w-72 xl:w-80' : 'w-0'} 
            transition-all duration-300 border-r border-border 
            bg-card/50 backdrop-blur-sm overflow-hidden flex-shrink-0
          `}
        >
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Traffic Simulator */}
              <TrafficSimulator
                isSimulating={isSimulating}
                isPaused={isPaused}
                speed={speed}
                edges={edges}
                trafficMultipliers={trafficMultipliers}
                onToggleSimulation={handleToggleSimulation}
                onTogglePause={togglePause}
                onSpeedChange={setSpeed}
                onSimulateAccident={simulateAccident}
                onClearAccidents={clearAccidents}
                onTrafficLevelChange={setTrafficLevel}
                selectedEdge={selectedEdge}
              />

              {/* Route Finder */}
              <RouteFinder
                nodes={nodes}
                edges={edges}
                onRouteCalculated={handleRouteCalculated}
                trafficMultipliers={trafficMultipliers}
              />

              {/* Quick Actions */}
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("builder")}
                  >
                    <Hammer className="w-4 h-4 mr-2" />
                    Build Network
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("templates")}
                  >
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Load Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("import")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import/Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("learn")}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Learn Mode
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsTutorialOpen(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </aside>

        {/* Toggle Left Sidebar (Desktop only) */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="hidden md:block absolute top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-r-lg p-1 hover:bg-muted transition-colors"
          style={{ left: leftSidebarOpen ? '288px' : '0' }}
        >
          {leftSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Center - Main Visualization */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border px-2 md:px-4 py-2 bg-card/30 backdrop-blur-sm overflow-x-auto">
              <TabsList className="h-auto flex flex-wrap gap-1 bg-transparent p-0">
                <TabsTrigger value="map" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Network className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Traffic</span> Map
                </TabsTrigger>
                <TabsTrigger value="kruskal" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Route className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Kruskal's
                </TabsTrigger>
                <TabsTrigger value="dijkstra" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Navigation className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Dijkstra's
                </TabsTrigger>
                <TabsTrigger value="prim" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <TreeDeciduous className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Prim's
                </TabsTrigger>
                <TabsTrigger value="builder" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Hammer className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Grid3x3 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="import" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Upload className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Import
                </TabsTrigger>
                <TabsTrigger value="learn" className="text-[10px] md:text-xs gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <GraduationCap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Learn
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-2 md:p-4">
              <TabsContent value="map" className="m-0 h-full min-h-[300px] md:min-h-[400px]">
                <TrafficMapCanvas
                  nodes={nodes}
                  edges={edges}
                  trafficMultipliers={trafficMultipliers}
                  highlightedPath={highlightedPath}
                  mstEdges={mstEdges}
                  selectedEdge={selectedEdge}
                  onEdgeSelect={setSelectedEdge}
                  onNodeSelect={setSelectedNode}
                  currentNode={selectedNode}
                  visitedNodes={new Set()}
                  mapType={currentMapType}
                />
              </TabsContent>

              <TabsContent value="kruskal" className="m-0">
                <GraphVisualization nodes={nodes} edges={edges} />
              </TabsContent>

              <TabsContent value="dijkstra" className="m-0">
                <DijkstraVisualization nodes={nodes} edges={edges} />
              </TabsContent>

              <TabsContent value="prim" className="m-0">
                <PrimVisualization nodes={nodes} edges={edges} />
              </TabsContent>

              <TabsContent value="builder" className="m-0">
                <GraphBuilder 
                  nodes={nodes} 
                  edges={edges} 
                  setNodes={setNodes} 
                  setEdges={setEdges} 
                />
              </TabsContent>

              <TabsContent value="templates" className="m-0">
                <GraphTemplates 
                  onLoadTemplate={(templateNodes, templateEdges, mapType) => {
                    setNodes(templateNodes);
                    setEdges(templateEdges);
                    setCurrentMapType(mapType || null);
                    setActiveTab("map");
                  }} 
                />
              </TabsContent>

              <TabsContent value="import" className="m-0">
                <GraphImport 
                  onImportGraph={(data) => {
                    setNodes(data.nodes);
                    setEdges(data.edges.map(e => ({
                      from: e.from,
                      to: e.to,
                      weight: e.weight,
                      traffic: e.traffic > 0.6 ? 'high' : e.traffic > 0.3 ? 'medium' : 'low',
                      isBlocked: e.blocked
                    })));
                    setActiveTab("map");
                  }}
                  currentGraph={{
                    nodes,
                    edges: edges.map(e => ({
                      from: e.from,
                      to: e.to,
                      weight: e.weight,
                      traffic: e.traffic === 'low' ? 0.3 : e.traffic === 'medium' ? 0.6 : 0.9,
                      blocked: e.isBlocked || false
                    }))
                  }}
                />
              </TabsContent>

              <TabsContent value="learn" className="m-0">
                <EducationalMode />
              </TabsContent>
            </div>
          </Tabs>
        </main>

        {/* Toggle Right Sidebar (Desktop only) */}
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="hidden md:block absolute top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-l-lg p-1 hover:bg-muted transition-colors"
          style={{ right: rightSidebarOpen ? '288px' : '0' }}
        >
          {rightSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Right Sidebar - Metrics & Insights */}
        <aside 
          className={`
            hidden md:block
            ${rightSidebarOpen ? 'w-72 xl:w-80' : 'w-0'} 
            transition-all duration-300 border-l border-border 
            bg-card/50 backdrop-blur-sm overflow-hidden flex-shrink-0
          `}
        >
          <ScrollArea className="h-full">
            <div className="p-4">
              <SystemDashboard
                nodes={nodes}
                edges={edges}
                trafficMultipliers={trafficMultipliers}
                algorithmStatus={algorithmStatus}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>
      
      {/* Interactive Tutorial */}
      <InteractiveTutorial 
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        nodes={nodes}
        edges={edges}
        currentTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </div>
  );
};

export default Dashboard;
