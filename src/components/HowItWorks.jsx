const steps = [
    {
        number: '01',
        title: 'Request an account',
        description: 'Send your household number and zone. The barangay reviews it and emails your login.',
    },
    {
        number: '02',
        title: 'Report a water problem',
        description: 'Log in and report odor, discoloration, low pressure and more, with when it happened.',
    },
    {
        number: '03',
        title: 'Staff check and measure',
        description: 'Staff review your report, record TDS readings, and update its status.',
    },
    {
        number: '04',
        title: 'Track and follow up',
        description: 'Follow your report and household TDS history. Repeat issues are flagged for action.',
    },
]

const HowItWorks = ({ isLoggedIn }) => (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="bg-[#102765] py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <span className="block text-xs font-bold uppercase tracking-widest text-cyan-200">How it works</span>
            <h2 id="how-it-works-heading" className="mt-2 mb-10 text-3xl font-bold tracking-tight text-white">
                Four simple steps
            </h2>

            <ol role="list" className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {steps.map((step) => (
                    <li key={step.number} className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/5 p-6">
                        <span aria-hidden="true" className="mb-4 text-4xl font-bold leading-none text-cyan-200">
                            {step.number}
                        </span>
                        <h3 className="mb-2 text-base font-medium text-white">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-blue-100">{step.description}</p>
                    </li>
                ))}
            </ol>

            {!isLoggedIn && (
                <p className="mt-8 text-sm text-blue-100">
                    No account yet? You can still{' '}
                    <a
                        href="#contact"
                        className="rounded-sm text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        send a concern
                    </a>
                    {' '}from the form below.
                </p>
            )}
        </div>
    </section>
)

export default HowItWorks
