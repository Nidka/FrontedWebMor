import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: false
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], field: string, value: any): any[] {
    if (!items) return [];
    if (!field || value === undefined) return items;
    
    return items.filter(item => item[field] === value);
  }
}
