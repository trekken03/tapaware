import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const PrivacyModal = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-3 text-sm text-foreground/80 text-left">
            <p>
              TapAware collects only the information needed to operate the water
              quality monitoring system for Barangay Cabalantian. For resident
              accounts, this is limited to a name and email address for login, and a
              household/purok identifier. For water quality monitoring, the system
              records TDS readings, location (barangay, purok, and household or
              water source), and optional observable conditions such as odor or
              discoloration. TDS readings are linked to a household or location
              identifier, not to a specific individual.
            </p>
            <p>
              In line with the Data Privacy Act of 2012, access to stored data is
              restricted to authorized barangay staff and administrator accounts,
              which are protected by login credentials. Personal information is used
              only to operate and improve the system's monitoring and reporting
              functions, and is not shared with unauthorized third parties.
            </p>
            <p>
              Data is retained only for as long as necessary to support ongoing water
              quality monitoring, reporting, and decision-making for the barangay.
            </p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default PrivacyModal
