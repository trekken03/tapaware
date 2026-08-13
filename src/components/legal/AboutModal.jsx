import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const AboutModal = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About TapAware</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-3 text-sm text-foreground/80 text-left">
            <p>
              TapAware is a web-based water quality monitoring system developed for
              Barangay Cabalantian, Bacolor, Pampanga. It uses Total Dissolved Solids
              (TDS) readings collected from selected households and water sources to
              help barangay officials monitor water conditions, track recurring
              concerns, and prioritize areas that may need attention.
            </p>
            <p>
              Residents can submit water quality complaints and track their status,
              while barangay staff and administrators use the system's reports and
              visualizations to support monitoring and decision-making across the
              barangay's puroks.
            </p>
            <p>
              TapAware was developed by Group IT03, a team of Information Technology
              students from Pampanga State University, as part of their capstone
              research project, "Development of a Water Quality Monitoring System
              with Total Dissolved Solids Data for Decision Support."
            </p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default AboutModal
