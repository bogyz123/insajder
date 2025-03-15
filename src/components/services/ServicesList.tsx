export default function ServicesList({ children }: { children: React.ReactNode }): React.ReactNode {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2  p-1.5 rounded-md gap-2">
            {children}
        </div>
    );
}
