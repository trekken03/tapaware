import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const TermsModal = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of Use</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-3 text-sm text-foreground/80 text-left">
            <p>
              TapAware is a decision-support tool intended to help barangay officials
              and residents monitor and document water quality conditions using
              Total Dissolved Solids (TDS) readings.
            </p>
            <p>
              TDS readings provide a general, practical indicator of water quality
              but do not identify specific contaminants and are not a substitute for
              laboratory testing or certified water quality analysis. The system
              does not certify that any water source is safe for drinking or other
              use, and does not perform repairs or maintenance on water sources —
              verification and corrective action remain the responsibility of the
              appropriate barangay and health authorities.
            </p>
            <p>
              Reports and observations submitted through the system are meant to
              support monitoring and prioritization efforts by barangay officials
              and should not be treated as a substitute for professional inspection.
            </p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default TermsModal
