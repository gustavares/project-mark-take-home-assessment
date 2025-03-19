import { Topic } from "../entities/Topic";

export type ResourceDTO = {
    topicId: string;
    topicVersion: number;
    url: string;
    description: string;
    type: 'pdf' | 'video' | 'article';
};

export type PatchTopicDTO = {
    content?: string;
    resources: ResourceDTO[];
};

export type TopicDTO = {
    name: string;
    content: string;
    parentTopicId?: string;
    resources: ResourceDTO[]
}