-- Verificar quais status existem atualmente na tabela
SELECT
  status,
  COUNT(*) as quantidade
FROM experts_benefits
GROUP BY status
ORDER BY quantidade DESC;
