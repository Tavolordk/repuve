import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'documentType',
})
export class DocumentTypePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
