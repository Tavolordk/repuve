import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vehicleStatus',
})
export class VehicleStatusPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
