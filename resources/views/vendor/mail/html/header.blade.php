@php
    $locale = Cookie::get('__hf_lcl') ?? "";
@endphp
@props(['url'])
<tr>
    <td class="header">
        <a href="{{ $url }}/{{ $locale }}" style="display: inline-block;">
            <img src="{{ asset('assets/images/kakbima_logo.png') }}" class="logo" alt="Kakbima">
        </a>
    </td>
</tr>
