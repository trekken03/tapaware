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
            <h1 className='font-bold'>Data Collection and Use</h1>
            <p>


              The Water Quality Monitoring System collects and stores certain information from its users and from the community being studied. This portion of the document explains what information is gathered and how it is handled by the research team.
            </p>
            <h1 className='font-bold'>
              1. Types of Information Collected
            </h1>
            <p>
              The system handles two types of information. Water quality data makes up most of what gets stored. Every record includes the TDS measurement in parts per million, the sampling location, and the collection timestamp. Location details are divided into barangay, purok, and specific household or water source. If the person collecting the sample observed anything notable like odor or discoloration, that can be added as an optional note. These observations only serve as supplementary context.
            </p>
            <p>The other type is user account information. The system saves usernames and passwords and nothing beyond that. No additional user details are kept. These credentials exist for authentication and for controlling what each user can do within the platform.</p>
            <h1 className='font-bold'>2. Purpose of Processing</h1>
            <p>Water quality records get turned into reports and visual summaries. Barangay officials in Cabalantian, Bacolor, Pampanga use these outputs to spot trends and figure out which areas might need attention. That is the core reason the system was built.</p>
            <p>User credentials are not processed for anything beyond authentication and access management.</p>
            <h1 className='font-bold'>3. Security Measures</h1>
            <p>The platform will not display or allow changes to any records unless the person on the other end has logged in with proper credentials. This applies equally to residents, barangay staff, and administrators. The database behind the system is also secured so that outsiders cannot break in or modify what is stored. Personal information is handled according to Republic Act No. 10173, also known as the Data Privacy Act of 2012.</p>
            <h1 className='font-bold'>4. Data Retention</h1>
            <p>Collected data will not be kept forever. The research team plans to retain all information only until the study and evaluation period are finished. After that, electronic files and database contents will be permanently deleted.</p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default PrivacyModal
