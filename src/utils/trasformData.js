export function transformData(data) {
  const nodes = [];
  const nodeIds = [];
  const edges = [];

  let courseNode = {};
  let courseEdge = {};

  const plan = data.plan.data;
  const historial = data.cursados.data.historial;

  const cursadosMap = new Map(
    historial
      .filter(c => c.calificacion >= 11)
      .map(c => [c.codAsignatura.trim(), c])
  );

  plan.forEach((course) => {
    // ignorar los cursos no obligatorios
    if (course.tipoAsignatura === 'E') return;

    const cod = course.codAsignatura.trim();

    // añadir los demas nodos de cursos
    const nodeExist = nodeIds.some((nodeId) => nodeId === course.codAsignatura);

    if (!nodeExist) {

      const cursoCursado = cursadosMap.get(cod);

      courseNode = {
        id: cod,
        data: { label: course.desAsignatura },
        ciclo: course.ciclo,
        creditos: course.creditos,
        cursado: cursoCursado ? "Aprobado" : "No aprobado",
        nota: cursoCursado?.calificacion ?? "-"
      };

      nodes.push(courseNode);
      nodeIds.unshift(course.codAsignatura);
    }

    // añadir los edges
    if (course.codAsignaturaPre !== 'NR') {
      courseEdge = {
        id: course.codAsignaturaPre + '-' + course.codAsignatura,
        source: course.codAsignaturaPre,
        target: course.codAsignatura,
      };
      edges.push(courseEdge);
    }
  });

  // Asignar posiciones y valores básicos
  let ciclo = 1;
  let cont = 1;

  const horizontalSpace = 400;
  const verticalSpace = 150;

  const positionedNodes = nodes.map((node) => {
    if (ciclo !== node.ciclo) {
      ciclo = node.ciclo;
      cont = 1;
    }

    const xPos = ciclo * horizontalSpace;
    const yPos = cont * verticalSpace;

    cont++;

    return {
      ...node,
      sourcePosition: 'right',
      targetPosition: 'left',
      position: { x: xPos, y: yPos },
      className: 'node-base node-standard',
    };
  });

  for (let i = 1; i <= 10; i++) {
    positionedNodes.push({
      id: `nodoCiclo${i}`,
      data: { label: `CICLO ${i}` },
      ciclo: i,
      credito: 0,
      sourcePosition: 'right',
      targetPosition: 'left',
      position: { x: i * horizontalSpace, y: 0 },
      className: 'node-base node-standard',
    });
  }

  // Asignar colores y estilos a los edges
  const colorNames = [
    '#d51f68',
    '#f96708',
    '#fabd40',
    '#2ddd6a',
    '#6ad7d6',
    '#2bb5f3',
    '#ba29e0',
  ];

  const edgeColors = {};
  let colorIndex = 0;

  const styledEdges = edges.map((edge) => {
    let color = edgeColors[edge.source];

    if (!color) {
      color = colorNames[colorIndex];
      edgeColors[edge.source] = color;

      if (colorIndex === colorNames.length - 1) {
        colorIndex = 0;
      } else {
        colorIndex++;
      }
    }

    return {
      ...edge,
      type: 'smart',
      hidden: true,
      style: { stroke: color, strokeWidth: 2 },
    };
  });

  return { nodes: positionedNodes, edges: styledEdges };
}
