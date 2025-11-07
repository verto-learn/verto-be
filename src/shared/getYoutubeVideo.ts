import config from "../config/config";

type GeneratedYoutubeVideoResponse = {
  items: {
    id: {
      videoId: string;
    };
  }[];
};

type GetLinkYoutubeVideo = {
  url: string;
  url_embed: string;
};

export const getLinkYoutubeVideo = async (
  query: string,
): Promise<GetLinkYoutubeVideo> => {
  const url = `${config.youtubeApiBaseUrl}?part=snippet&q=${encodeURIComponent(query)}&key=${config.youtubeApiKey}&maxResults=2`;

  const fetching = await fetch(url, {
    method: "GET",
  });

  if (!fetching.ok) {
    throw new Error("Failed to fetch YouTube video");
  }

  const data = (await fetching.json()) as GeneratedYoutubeVideoResponse;

  return {
    url: `https://www.youtube.com/watch?v=${data.items[0]?.id.videoId}`,
    url_embed: `https://www.youtube.com/embed/${data.items[0]?.id.videoId}`,
  };
};