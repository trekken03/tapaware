import AboutModal from './AboutModal'
import PrivacyModal from './PrivacyModal'
import TermsModal from './TermsModal'
import { cn } from '@/lib/utils'

const FooterLegalLinks = ({ variant = 'light', className }) => {
    const linkClass = cn(
        'underline-offset-2 hover:underline cursor-pointer bg-transparent border-0 p-0',
        variant === 'dark' ? 'text-blue-300 hover:text-blue-100' : 'text-gray-500 hover:text-gray-700',
    )

    return (
        <div className={cn('flex items-center gap-3 text-xs sm:text-sm', className)}>
            <AboutModal trigger={<button type="button" className={linkClass}>About Us</button>} />
            <span className={variant === 'dark' ? 'text-blue-400/50' : 'text-gray-300'}>·</span>
            <PrivacyModal trigger={<button type="button" className={linkClass}>Privacy Policy</button>} />
            <span className={variant === 'dark' ? 'text-blue-400/50' : 'text-gray-300'}>·</span>
            <TermsModal trigger={<button type="button" className={linkClass}>Terms of Use</button>} />
        </div>
    )
}

export default FooterLegalLinks
