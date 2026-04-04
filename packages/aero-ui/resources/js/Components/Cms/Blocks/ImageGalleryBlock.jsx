import React, { useState } from 'react';
import { Modal, ModalContent, ModalBody, useDisclosure } from '@heroui/react';

const ImageGalleryBlock = ({ data = {} }) => {
    const {
        title = 'Gallery',
        columns = 3,
        images = []
    } = data;

    const [selectedImage, setSelectedImage] = useState(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const imageList = typeof images === 'string' ? JSON.parse(images || '[]') : (images || []);
    const gridClass = `grid-cols-${Math.min(columns, 4)}`;

    const handleImageClick = (img) => {
        setSelectedImage(img);
        onOpen();
    };

    return (
        <div>
            {title && <h2 className="text-3xl font-bold mb-8">{title}</h2>}

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl">
                <ModalContent>
                    <ModalBody>
                        {selectedImage && (
                            <img src={selectedImage.url} alt={selectedImage.alt} className="w-full h-auto rounded" />
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:${gridClass} gap-4`}>
                {imageList.map((img, idx) => (
                    <div
                        key={idx}
                        className="relative overflow-hidden rounded-lg h-64 cursor-pointer group"
                        onClick={() => handleImageClick(img)}
                    >
                        <img
                            src={img.url}
                            alt={img.alt || `Gallery image ${idx}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageGalleryBlock;
