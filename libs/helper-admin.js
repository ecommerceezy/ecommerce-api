export const validateCategories = async (categoryIds, tx) => {
  const existingCategories = await tx.tb_category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true }
  });
  
  if (existingCategories.length !== categoryIds.length) {
    const missingIds = categoryIds.filter(id => 
      !existingCategories.some(cat => cat.id === id)
    );
    throw new Error(`Categories with IDs [${missingIds.join(', ')}] not found`);
  }
  
  return existingCategories;
};

export const uploadImages = async (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  const uploadPromises = images
    .filter(file => file && file.size > 0) // กรองไฟล์ที่ไม่ถูกต้อง
    .map(async (file) => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = file.name?.split('.').pop() || 'jpg';
      const fileName = `${timestamp}_${randomStr}.${extension}`;
      const filePath = `./public/upload/${fileName}`;
      
      try {
        await Bun.write(filePath, file);
        return `${fileName}`;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload image: ${file.name}`);
      }
    });
    
  return Promise.all(uploadPromises);
};

export const validateProductData = (data) => {
  const { pro_name, pro_price, freight, pro_number, categories } = data;
  
  const errors = [];
  
  if (!pro_name?.trim()) errors.push('Product name is required');
  if (!pro_price || isNaN(Number(pro_price))) errors.push('Valid product price is required');
  if (!freight || isNaN(Number(freight))) errors.push('Valid freight cost is required');
  if (!pro_number || isNaN(Number(pro_number))) errors.push('Valid product number is required');
  if (!categories?.trim()) errors.push('At least one category is required');
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
};
