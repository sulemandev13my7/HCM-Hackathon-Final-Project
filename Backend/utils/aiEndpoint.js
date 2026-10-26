const COMPLETIONS_PATH = "/chat/completions";

const buildAIEndpoint = (baseUrl) => {
  const normalizedBaseUrl = (baseUrl || "https://openrouter.ai/api/v1")
    .trim()
    .replace(/\/+$/, "");

  return normalizedBaseUrl.endsWith(COMPLETIONS_PATH)
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}${COMPLETIONS_PATH}`;
};

module.exports = { buildAIEndpoint };
