import { useGlobalStore } from '../store/useGlobalStore';
import { transformData } from './trasformData';

export const fetchData = async (user, pass) => {
  const setNodes = useGlobalStore.getState().setNodes;
  const setEdges = useGlobalStore.getState().setEdges;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, pass }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Error desconocido');
    }

    // console.log('Data fetched successfully:', result);


    const { nodes, edges } = transformData(result);

    setNodes(nodes);
    setEdges(edges);

    // testing
    // console.log('Data fetched', result);
    // console.log('Data transformed and set');
    // console.log('Nodes:', nodes);
    // console.log('Edges:', edges);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
