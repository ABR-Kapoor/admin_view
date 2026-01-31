export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
) {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Determine columns
    const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

    // Create CSV header
    const header = cols.map(col => col.label).join(',');

    // Create CSV rows
    const rows = data.map(item => {
        return cols.map(col => {
            const value = item[col.key];

            // Handle different data types
            if (value === null || value === undefined) {
                return '';
            }

            if (Array.isArray(value)) {
                return `"${value.join('; ')}"`;
            }

            if (typeof value === 'object') {
                return `"${JSON.stringify(value)}"`;
            }

            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
        }).join(',');
    });

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper function to format date for CSV
export function formatDateForCSV(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Helper function to format datetime for CSV
export function formatDateTimeForCSV(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:MM:SS
}
