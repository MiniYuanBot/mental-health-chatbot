import { emotionLabels } from '../utils/emotion';
import type { Resource } from '../data/resources';

type Props = {
  resource: Resource;
};

export default function ResourceCard({ resource }: Props) {
  return (
    <article className={resource.urgent ? 'resource-card urgent' : 'resource-card'}>
      <h3>{resource.title}</h3>
      <p>{resource.desc}</p>
      <div className="tag-row">
        {resource.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{emotionLabels[tag]}</span>
        ))}
      </div>
    </article>
  );
}