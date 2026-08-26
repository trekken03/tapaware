import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const MEMBERS = [
  { name: 'Bansil, Charlyn S.' },
  { name: 'Calma, Eldrick Shandelle R.' },
  { name: 'Capuno, Angel Lyn D.' },
  { name: 'Galanido, John Patrick D.' },

];
const MEMBERS2 = [

  { name: 'Pamintuan, Aries D.' },
  { name: 'Quiroz, Crisanne Josea F.' },
  { name: 'Suarez, Carlo Hanz M.' },
];

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
            <h1 className="font-bold">Project Overview</h1>
            <p>

              The Water Quality Monitoring System with Total Dissolved Solids (TDS) Data for Decision Support is a web-based platform designed to assist the barangay officials of Cabalantian, Bacolor, Pampanga in monitoring and documenting community water quality.


            </p>
            <p> This system was developed as a capstone project in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology at the College of Computing Studies, Pampanga State University.
              Our primary objective is to centralize TDS readings and location-based data, enabling the generation of structured summaries and visualizations that support informed decision-making for the prioritization of water quality interventions.
            </p>
            <h1 className="font-bold">Research Team</h1>
            <div className=" grid grid-cols-2 gap-4">
              <div className='space-y-1'>
                {MEMBERS.map((item) => (
                  <p key={item.name} >{item.name}</p>
                )
                )}
              </div>
              <div className='space-y-1'>
                {MEMBERS2.map((item) => (
                  <p key={item.name} >{item.name}</p>
                )
                )}
              </div>
            </div>

          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default AboutModal
