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
            <h1 className='font-bold'>Acceptance of Terms</h1>
            <p>By accessing or using the Water Quality Monitoring System, users agree to be bound by the terms and conditions described in this section. These terms apply to all individuals who interact with the platform regardless of their assigned role.</p>
            <h1 className='font-bold'>1. What This System Is For</h1>
            <p>This platform was created as a capstone project. It helps the barangay officials of Cabalantian, Bacolor, Pampanga keep track of water quality by organizing TDS readings taken from different households and water sources. The data gets presented through charts and summaries so officials can see which areas may need follow up or prioritization. </p>
            <h1 className='font-bold'>2. What This System Is Not</h1>
            <p>This is not a laboratory tool. The system only handles TDS data and optional notes about odor or discoloration. It does not test for chemicals, bacteria, or any other contaminants. It cannot say whether water is safe to drink or use. That kind of determination has to come from trained professionals with proper equipment. If there is a real concern, it should go to the right government office or agency.</p>
            <h1 className='font-bold'>3. User Obligations</h1>
            <p>
              Residents who submit complaints should be truthful and stick to what they actually observed. Fake or inflated reports just create more work for everyone. Barangay staff and admins need to manage the records properly and check entries that seem off. Everyone should keep their passwords to themselves. Sharing login details is not allowed.
            </p>
            <h1 className='font-bold'>4. Liability</h1>
            <p>The development team and Pampanga State University are not responsible for decisions made only from the system's output. It is a support tool, not a substitute for professional evaluation. Serious concerns should go to the appropriate authorities.</p>
            <h1 className='font-bold'>5. Revisions</h1>
            <p>The team may update these terms if needed. Posted changes take effect immediately. Continued use after updates means acceptance of the new terms.
            </p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default TermsModal
