import React from 'react';

const VideoBlock = ({ data = {} }) => {
    const {
        title = '',
        videoUrl = '',
        caption = '',
        aspectRatio = '16:9',
        autoplay = false
    } = data;

    const getEmbedUrl = (url) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtu.be')
                ? url.split('/').pop().split('?')[0]
                : new URL(url).searchParams.get('v');
            return `https://www.youtube.com/embed/${videoId}?${autoplay ? 'autoplay=1' : ''}`;
        } else if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}?${autoplay ? 'autoplay=1' : ''}`;
        }
        return url;
    };

    const aspectRatioClass = {
        '16:9': 'aspect-video',
        '4:3': 'aspect-[4/3]',
        '1:1': 'aspect-square'
    }[aspectRatio] || 'aspect-video';

    return (
        <div>
            {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

            <div className={`${aspectRatioClass} w-full rounded-lg overflow-hidden bg-default-100`}>
                <iframe
                    className="w-full h-full"
                    src={getEmbedUrl(videoUrl)}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            {caption && (
                <p className="text-sm text-default-500 mt-4 text-center">{caption}</p>
            )}
        </div>
    );
};

export default VideoBlock;
