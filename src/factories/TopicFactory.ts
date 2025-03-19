import { TopicDTO, ResourceDTO } from "../dtos/topic.dto";
import { Resource } from "../entities/Resource";
import { Topic } from "../entities/Topic";

class ResourceFactory {
    static createNew(resourceData: ResourceDTO) {
        return new Resource(
            resourceData.topicId,
            resourceData.topicVersion,
            resourceData.url,
            resourceData.description,
            resourceData.type
        );
    }
}

export class TopicFactory {
    static createNew(topicData: TopicDTO): Topic {
        return new Topic(
            undefined,
            topicData.name,
            topicData.content,
            1,
            new Date(),
            new Date(),
            topicData.parentTopicId,
            topicData.resources.map(r => ResourceFactory.createNew(r)),
        );
    }

    static createNextVersion(existingTopic: Topic, resourceDtos: ResourceDTO[] = [], newContent?: string): Topic {
        const newVersionNumber = existingTopic.version + 1;
        return new Topic(
            existingTopic.id,
            existingTopic.name,
            newContent ?? existingTopic.content,
            newVersionNumber,
            existingTopic.createdAt,
            new Date(),
            existingTopic.parentTopicId,
            resourceDtos.map(r => ResourceFactory.createNew({ ...r, topicVersion: newVersionNumber })),
            existingTopic.subtopics,
        );
    }
}
