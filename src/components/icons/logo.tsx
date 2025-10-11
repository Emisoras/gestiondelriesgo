import Image from 'next/image';
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement> & { width?: number; height?: number }) {
  const { width = 48, height = 48, ...rest } = props;
  return (
    <Image
      src="/logo.png"
      alt="ResQ Hub Logo"
      width={width}
      height={height}
      className={props.className}
      // Si el logo tiene fondo transparente, no se necesita un estilo adicional.
      // Si es un SVG como antes, se podría usar 'fill="currentColor"' para que herede el color del texto.
      // Para un PNG, el color está en la propia imagen.
    />
  );
}
