import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { CompareQueryDto } from './dto/compare-query.dto';
import { CompareService } from './compare.service';

@Controller('/compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Post('')
  async compare(@Body() body: CompareQueryDto) {
    const { left, right } = body;

    const arr = [left, right];

    const filtersMean = await Promise.all(
      arr.map(async (filter) => {
        if (!filter) return;
        return this.compareService.getMeanInclusive(filter);
      }),
    );

    if (filtersMean[0] && filtersMean[1]) {
      return {
        data: {
          left: filtersMean[0],
          right: filtersMean[1],
          diff: this.compareService.getDiffBetweenResults(
            filtersMean[0],
            filtersMean[1],
          ),
        },
      };
    } else {
      return { data: { left: filtersMean[0], right: filtersMean[1] } };
    }
  }
}
