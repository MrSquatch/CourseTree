import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  applyEdgeChanges,
  applyNodeChanges,
  EdgeChange,
  NodeChange,
  OnEdgesChange,
  OnNodesChange,
} from 'reactflow';

import { initialNodes } from '../components/Shell/Flow/data/nodes.jsx';
import { initialEdges } from '../components/Shell/Flow/data/edges';

import { bfs } from '../utils/flowUtils';

interface GlobalStore {
  user: string | null;
  setUser: (user: string | null) => void;

  nodes: any[];
  edges: any[];

  setNodes: (nodes: any[]) => void;
  setEdges: (edges: any[]) => void;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;

  selectedNode: any;
  setSelectedNode: (nodeId: any) => void;

  getNodeData: () => any;
  updateEdges: (updateFn: (edges: any[]) => any[]) => void;

  adjListSource: { [key: string]: string[] };
  adjListTarget: { [key: string]: string[] };

  setAdjListSource: (adjListSource: { [key: string]: string[] }) => void;
  setAdjListTarget: (adjListTarget: { [key: string]: string[] }) => void;

  createAdjLists: () => void;

  markEdges: () => void;
}

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user: string | null) => set({ user }),

      nodes: initialNodes,
      edges: initialEdges,

      setNodes: (nodes: any[]) => set({ nodes }),
      setEdges: (edges: any[]) => {
        set({ edges });
        get().createAdjLists();
      },

      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      selectedNode: null,
      setSelectedNode: (nodeId: any) => set({ selectedNode: nodeId }),

      getNodeData: () => {
        const nodes = get().nodes;
        const selectedNode = get().selectedNode;
        return nodes.find((node) => node.id === selectedNode);
      },

      updateEdges: (updateFn: (edges: any[]) => any[]) => {
        set((state) => ({
          edges: updateFn(state.edges),
        }));
      },

      adjListSource: {},
      adjListTarget: {},

      setAdjListSource: (adjListSource: any) => set({ adjListSource }),
      setAdjListTarget: (adjListTarget: any) => set({ adjListTarget }),

      createAdjLists: () => {
        const edges = get().edges;

        // console.log('edges', edges);

        const newAdjListSource: { [key: string]: string[] } = {};
        const newAdjListTarget: { [key: string]: string[] } = {};

        edges.forEach((edge) => {
          if (newAdjListSource[edge.source] === undefined) {
            newAdjListSource[edge.source] = [];
          }
          newAdjListSource[edge.source].push(edge.target);

          if (newAdjListTarget[edge.target] === undefined) {
            newAdjListTarget[edge.target] = [];
          }
          newAdjListTarget[edge.target].push(edge.source);
        });

        // testing
        // console.log('newAdjListSource', newAdjListSource);
        // console.log('newAdjListTarget', newAdjListTarget);

        set({
          adjListSource: newAdjListSource,
          adjListTarget: newAdjListTarget,
        });
      },

      markEdges: () => {
        const { selectedNode, adjListSource, adjListTarget, updateEdges } =
          get();

        const markedEdgesTarget: string[] = [];
        const markedEdgesSource: string[] = [];

        if (selectedNode) {
          if (adjListTarget[selectedNode]) {
            adjListTarget[selectedNode].forEach((node) => {
              markedEdgesTarget.push(node + '-' + selectedNode);
            });
          }

          const reachableNodes = bfs(selectedNode, adjListSource);

          reachableNodes.forEach((node) => {
            markedEdgesSource.push(node);
          });
        }

        // testing
        // console.log('markedEdgesTarget', markedEdgesTarget);
        // console.log('markedEdgesSource', markedEdgesSource);

        updateEdges((eds) => {
          const newEdges = eds.map((edge) => {
            const newEdge = { ...edge, style: { ...edge.style } };

            if (selectedNode === null) {
              newEdge.hidden = true;
            } else if (markedEdgesTarget.includes(edge.id)) {
              newEdge.hidden = false;
            } else if (markedEdgesSource.includes(edge.source)) {
              newEdge.hidden = false;
            } else {
              newEdge.hidden = true;
            }

            return newEdge;
          });

          return newEdges;
        });
      },
    }),
    {
      name: 'global-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { createAdjLists, adjListSource, adjListTarget } = state;
          if (
            Object.keys(adjListSource).length === 0 &&
            Object.keys(adjListTarget).length === 0
          ) {
            createAdjLists();
          }
        }
      },
    }
  )
);
