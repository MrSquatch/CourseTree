import { Stack, Title, Text } from '@mantine/core';
import { useGlobalStore } from '../../../store/useGlobalStore';

export default function Aside() {
  const selectedNodeData = useGlobalStore((state) => state.getNodeData());

  return (
    <Stack p="md">
      <Title order={3}>Plan de Estudios</Title>
      <Title order={4}>Detalles</Title>

      {selectedNodeData ? (
        <>
          <Text>
            <strong>Nombre:</strong> {selectedNodeData.data.label}
          </Text>
          {!selectedNodeData.id.includes('nodoCiclo') ? (
            <>
              <Text>
                <strong>ID:</strong> {selectedNodeData.id}
              </Text>
              <Text>
                <strong>Ciclo:</strong> {selectedNodeData.ciclo}
              </Text>
              <Text>
                {selectedNodeData.creditos ? (
                  <>
                    <strong>Creditos:</strong> {selectedNodeData.creditos}
                  </>
                ) : null}
              </Text>
            </>
          ) : null}
        </>
      ) : (
        <Text>No hay datos seleccionados. Selecciona un curso para ver sus detalles.</Text>
      )}
    </Stack>
  );
}
