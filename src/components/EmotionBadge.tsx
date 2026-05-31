import { emotionLabels, riskLabels, type Emotion, type RiskLevel } from '../utils/emotion';

type Props = {
  emotion: Emotion;
  riskLevel?: RiskLevel;
  score?: number;
};

export default function EmotionBadge({ emotion, riskLevel, score }: Props) {
  return (
    <span className={`emotion-badge emotion-${emotion}`}>
      {emotionLabels[emotion]}
      {typeof score === 'number' ? ` · ${score}/10` : ''}
      {riskLevel ? ` · ${riskLabels[riskLevel]}` : ''}
    </span>
  );
}
