import * as React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function ConfirmDialog({
    title,
    description,
    actionText = "Confirm",
    actionVariant = "destructive",
    onConfirm,
    children,
    size = "sm",
}) {
    return (
        <AlertDialog >
            {/* No styling here on purpose: asChild merges the trigger's classes onto
                the button inside, so anything set here silently overrides that
                button's own shape everywhere ConfirmDialog is used. */}
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent size={size} >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
                </AlertDialogHeader>
                <AlertDialogFooter className="border-t-0 bg-white">
                    <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction variant={actionVariant} onClick={onConfirm} className="hover:cursor-pointer">
                        {actionText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export { ConfirmDialog }
