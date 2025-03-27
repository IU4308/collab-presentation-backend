import { Presentation } from "../model/Presentation.js";

export const findPresentation = async (presentationId) => {
    const presentation = await Presentation.findOne({ presentationId });
    if (!presentation) throw new Error('Presentation not found');
    return presentation;
};

// Utility to find a slide within a presentation
export const findSlide = (presentation, slideId) => {
    const slide = presentation.slides.find((s) => s.slideId === slideId);
    if (!slide) throw new Error('Slide not found');
    return slide;
};

// Utility to find a field within a slide
export const findField = (slide, fieldId) => {
    const field = slide.fields.find((f) => f.id === fieldId);
    if (!field) throw new Error('Field not found');
    return field;
};