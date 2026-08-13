import * as React from "react"

import { cn } from "@/lib/utils"

// Tables always fill their container. Below the `md` breakpoint the
// `table-stacked` rules in index.css collapse each row into a labelled card,
// so phones get cards instead of a squashed grid or sideways scrolling.
// Pages set their desktop floor with a responsive min-width, e.g.
// `<Table className="md:min-w-[720px]">` — never a bare `min-w-*`, which would
// force the card layout to stay table-wide on mobile.
function Table({ className, containerClassName, ...props }) {
    return (
        <div className={cn("w-full overflow-x-auto rounded-lg border border-gray-200 max-md:rounded-none max-md:border-0", containerClassName)}>
            <table className={cn("table-stacked w-full divide-y divide-gray-200 bg-white", className)} {...props} />
        </div>
    )
}

function TableHeader({ className, ...props }) {
    return (
        <thead className={cn("bg-blue-800", className)} {...props} />
    )
}

function TableBody({ className, ...props }) {
    return <tbody className={cn("bg-white divide-y divide-gray-200", className)} {...props} />
}

function TableRow({ className, ...props }) {
    return <tr className={cn(className)} {...props} />
}

function TableHead({ className, ...props }) {
    return (
        <th
            scope="col"
            className={cn(
                "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap",
                className
            )}
            {...props}
        />
    )
}

// `label` is what the cell is called once the table stacks into cards on
// mobile, where the header row is hidden. Cells left unlabelled (action
// buttons) simply take the full width of the card.
function TableCell({ className, label, ...props }) {
    return (
        <td
            data-label={label}
            className={cn("px-4 py-3 text-sm text-gray-700", className)}
            {...props}
        />
    )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
