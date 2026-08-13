import * as React from "react"

import { cn } from "@/lib/utils"

function getPageItems(currentPage, totalPages, siblingCount = 1) {
    const pages = []
    const startPage = Math.max(1, currentPage - siblingCount)
    const endPage = Math.min(totalPages, currentPage + siblingCount)

    if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) pages.push("start-ellipsis")
    }

    for (let page = startPage; page <= endPage; page += 1) {
        pages.push(page)
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("end-ellipsis")
        pages.push(totalPages)
    }

    return pages
}

function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1, className, ...props }) {
    if (totalPages <= 1) {
        return null
    }

    const pageItems = getPageItems(currentPage, totalPages, siblingCount)

    return (
        <nav className={cn("flex flex-wrap items-center justify-between gap-2", className)} aria-label="Pagination" {...props}>
            <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className={cn(
                    "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition",
                    currentPage <= 1
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                )}
            >
                Previous
            </button>

            <div className="flex flex-wrap items-center gap-2">
                {pageItems.map((page) => {
                    if (page === "start-ellipsis" || page === "end-ellipsis") {
                        return (
                            <span key={page} className="px-2 text-sm text-gray-500">
                                …
                            </span>
                        )
                    }

                    return (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "inline-flex min-w-[2rem] items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition",
                                page === currentPage
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                            aria-current={page === currentPage ? "page" : undefined}
                        >
                            {page}
                        </button>
                    )
                })}
            </div>

            <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className={cn(
                    "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition",
                    currentPage >= totalPages
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                )}
            >
                Next
            </button>
        </nav>
    )
}

export { Pagination }
