import * as React from "react"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    actionText = "Confirm",
    actionVariant = "destructive",
    onConfirm,
    children,
    size = "sm",
    isLoading = false,
}) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [isConfirming, setIsConfirming] = React.useState(false)
    const isControlled = open !== undefined
    const dialogOpen = isControlled ? open : internalOpen
    const setDialogOpen = onOpenChange || setInternalOpen
    const isBusy = isLoading || isConfirming

    const handleConfirm = async () => {
        setIsConfirming(true)
        try {
            await onConfirm?.()
            setDialogOpen(false)
        } finally {
            setIsConfirming(false)
        }
    }

    return (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {/* No styling here on purpose: asChild merges the trigger's classes onto
                the button inside, so anything set here silently overrides that
                button's own shape everywhere ConfirmDialog is used. */}
            {children ? <AlertDialogTrigger asChild>{children}</AlertDialogTrigger> : null}
            <AlertDialogContent size={size} >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
                </AlertDialogHeader>
                <AlertDialogFooter className="border-t-0 bg-white">
                    <AlertDialogCancel disabled={isBusy} className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                    <Button variant={actionVariant} disabled={isBusy} onClick={handleConfirm} className="hover:cursor-pointer">
                        {actionText}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export { ConfirmDialog }
