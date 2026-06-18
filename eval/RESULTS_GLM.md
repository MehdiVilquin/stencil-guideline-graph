# GLM-4.7 smoke eval — 25 generations (5 / language)

Model: `glm-4.7` @ `https://api.z.ai/api/paas/v4`

## Summary

| lang | provable green | allGreen | avg attempts | artifacts | EN leak | langOk |
|---|---|---|---|---|---|---|
| fr-FR | 23/23 | 2/5 | 0.40 | 0 | 0 | 2/5 |
| de-DE | 10/10 | 1/5 | 0.20 | 0 | 0 | 1/5 |
| it-IT | 12/12 | 1/5 | 0.20 | 0 | 0 | 1/5 |
| ja-JP | 10/10 | 1/5 | 0.20 | 0 | 0 | 1/5 |
| en-GB | 23/23 | 2/5 | 0.40 | 0 | 0 | 2/5 |

## Per-case detail

| id | attempts | green | allGreen | langOk | artifacts | EN leak | chars | copy |
|---|---|---|---|---|---|---|---|---|
| FR-long_description | 1 | 11/11 | ✅ | ✅ | — | — | 1167 | Redécouvre ton éclat naturel avec le Sérum Éclat Absolu® de Maison Lumière. Conçu spécifiquement pour raviver les peaux ternes, ce soin agit |
| FR-short_description | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| FR-title | 1 | 12/12 | ✅ | ✅ | — | — | 42 | Sérum Éclat Absolu® à l'acide hyaluronique |
| FR-bullet_points | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| FR-seo_meta | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| DE-long_description | 1 | 10/10 | ✅ | ✅ | — | — | 1494 | Entdecken Sie die transformative Kraft von Maison Lumière mit dem Sérum Éclat Absolu®. Diese leichte, schnell einziehende Formel wurde entwi |
| DE-short_description | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| DE-title | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| DE-bullet_points | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| DE-seo_meta | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| IT-long_description | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| IT-short_description | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| IT-title | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| IT-bullet_points | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| IT-seo_meta | 1 | 12/12 | ✅ | ✅ | — | — | 159 | L'olio detergente Maison Lumière elimina il trucco waterproof con delicatezza. Deterge viso e occhi per una pelle morbida, luminosa e perfet |
| JA-long_description | 1 | 10/10 | ✅ | ✅ | — | — | 419 | Maison Lumièreが提案する、肌本来の輝きを引き出す体験へようこそ。くすみが気になる肌に、「Sérum Éclat Absolu®」は軽やかなテクスチャーでなじみ、明るく透明感のある仕上がりを与えます。この美容液は、年齢を重ねても健やかで輝き続ける肌をサポートします。  |
| JA-short_description | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| JA-title | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| JA-bullet_points | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| JA-seo_meta | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| EN-long_description | 1 | 11/11 | ✅ | ✅ | — | — | 724 | Rediscover your natural glow with Maison Lumière. The Sérum Éclat Absolu® is a lightweight radiance serum designed to banish dullness and qu |
| EN-short_description | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| EN-title | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |
| EN-bullet_points | 1 | 12/12 | ✅ | ✅ | — | — | 249 | Reveal a smoother and more radiant complexion upon waking ⏎ Gentle retinol helps to smooth the appearance of fine lines ⏎ Shea butter deeply |
| EN-seo_meta | 0 | 0/0 | ❌ | ❌ | — | — | 0 | ⚠️ Error: 429 Rate limit reached for requests |

**Total:** 7/25 fully green · artifacts=0 · EN-leak=0 · errors=18
