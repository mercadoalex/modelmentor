interface Props {
  title:        string;
  description?: string;
}

/** Sets the document title and meta description for a page. */
export function PageMeta({ title, description }: Props) {
  document.title = `${title} | ModelMentor`;
  return null;
}