"use client"

import * as React from "react"

interface TabsProps {
    value: string
    onValueChange: (value: string) => void
    className?: string
    children: React.ReactNode
}

interface TabsListProps {
    className?: string
    children: React.ReactNode
}

interface TabsTriggerProps {
    value: string
    className?: string
    children: React.ReactNode
}

interface TabsContentProps {
    value: string
    className?: string
    children: React.ReactNode
}

const TabsContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
}>({
    value: "",
    onValueChange: () => { },
})

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
    ({ value, onValueChange, className, children }, ref) => {
        return (
            <TabsContext.Provider value={{ value, onValueChange }}>
                <div ref={ref} className={className}>
                    {children}
                </div>
            </TabsContext.Provider>
        )
    }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
    ({ className, children }, ref) => {
        return (
            <div
                ref={ref}
                className={`inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className || ""}`}
            >
                {children}
            </div>
        )
    }
)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ value, className, children }, ref) => {
        const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
        const isSelected = value === selectedValue

        return (
            <button
                ref={ref}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onValueChange(value)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isSelected
                        ? "bg-background text-foreground shadow-sm"
                        : "hover:bg-background/50 hover:text-foreground"
                    } ${className || ""}`}
            >
                {children}
            </button>
        )
    }
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ value, className, children }, ref) => {
        const { value: selectedValue } = React.useContext(TabsContext)

        if (value !== selectedValue) return null

        return (
            <div
                ref={ref}
                role="tabpanel"
                className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ""}`}
            >
                {children}
            </div>
        )
    }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
