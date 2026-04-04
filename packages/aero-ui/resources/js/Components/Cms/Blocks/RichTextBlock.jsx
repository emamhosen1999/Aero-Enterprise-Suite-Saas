import React from 'react';

const RichTextBlock = ({ data = {} }) => {
    const {
        content = '<p>Your content here</p>',
        textColor = '#000000',
        fontSize = 'normal'
    } = data;

    const fontSizeMap = {
        small: 'text-base',
        normal: 'text-lg',
        large: 'text-xl',
        xlarge: 'text-2xl'
    };

    return (
        <div
            className={`prose prose-lg max-w-none ${fontSizeMap[fontSize] || fontSizeMap.normal}`}
            style={{ color: textColor }}
        >
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
};

export default RichTextBlock;
