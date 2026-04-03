import { Badge } from 'react-bootstrap'
import { qualityLabel, qualityVariant } from '../../utils/formatters'
import { QualityCode } from '../../types'

export function StatusBadge({ quality }: { quality: QualityCode | number }) {
  return (
    <Badge bg={qualityVariant(quality)} pill>
      {qualityLabel(quality)}
    </Badge>
  )
}
