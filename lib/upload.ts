
export async function uploadImage(file: File, bucket: string = 'default'): Promise<string | null> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);

        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to upload image');
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Error in uploadImage:', error);
        return null;
    }
}
